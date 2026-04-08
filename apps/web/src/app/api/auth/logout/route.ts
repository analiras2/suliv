import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suliv/db";
import { requireAuth, AuthError } from "../../../../lib/auth-middleware";
import { z } from "zod";
import { verifyRefreshToken } from "@suliv/auth";
import { createHash } from "node:crypto";

const bodySchema = z.object({ refresh_token: z.string().min(1).optional() });

export async function POST(req: NextRequest) {
  // Require valid Bearer token
  try {
    await requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }

  // Optionally revoke the specific refresh token sent in body
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const refreshToken = parsed.success ? parsed.data.refresh_token : undefined;

  if (refreshToken) {
    try {
      await verifyRefreshToken(refreshToken);
      const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
      // Idempotent — no error if already revoked or not found
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Invalid refresh token JWT — still return 200 (logout is best-effort)
    }
  }

  return NextResponse.json({ success: true });
}
