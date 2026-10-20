import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiException } from '../../errors/api-exception';

export interface CursorPayload {
  sortValue: string | number;
  id: string;
}

const SIGNATURE_DELIMITER = '.';
const SIGNATURE_BYTES = 8;

/**
 * Signed, opaque keyset cursor: `base64(JSON({ sortValue, id })).hmacHex`.
 * It is ordering-agnostic — callers decide what `sortValue` means (a
 * timestamp, a computed score, ...). The HMAC only guards against crafted
 * cursors; it is not a security boundary.
 */
@Injectable()
export class PaginationCursorService {
  constructor(private readonly config: ConfigService) {}

  encode(payload: CursorPayload): string {
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString(
      'base64',
    );
    return `${body}${SIGNATURE_DELIMITER}${this.sign(body)}`;
  }

  /** Returns `null` for malformed or tampered input; never throws. */
  decode(cursor: string): CursorPayload | null {
    const [body, signature, ...rest] = cursor.split(SIGNATURE_DELIMITER);
    if (!body || !signature || rest.length > 0) return null;

    const expected = Buffer.from(this.sign(body));
    const received = Buffer.from(signature);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(
        Buffer.from(body, 'base64').toString('utf8'),
      );
      return isCursorPayload(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Decodes a client-supplied cursor, mapping any invalid one to the
   * `400 BAD_REQUEST` every paginated endpoint must answer with.
   */
  decodeOrThrow(cursor: string): CursorPayload {
    const payload = this.decode(cursor);
    if (!payload) {
      throw new ApiException('BAD_REQUEST', 'Invalid cursor');
    }
    return payload;
  }

  private sign(body: string): string {
    const secret = this.config.getOrThrow<string>('pagination.cursorSecret');
    return createHmac('sha256', secret)
      .update(body)
      .digest()
      .subarray(0, SIGNATURE_BYTES)
      .toString('hex');
  }
}

function isCursorPayload(value: unknown): value is CursorPayload {
  if (typeof value !== 'object' || value === null) return false;
  const { sortValue, id } = value as Record<string, unknown>;
  return (
    typeof id === 'string' &&
    (typeof sortValue === 'string' || typeof sortValue === 'number')
  );
}
