import { Injectable } from '@nestjs/common';

export interface CurrentTermsDto {
  version: string;
  url: string;
}

const CURRENT_TERMS_VERSION = '1.0.0';
const CURRENT_TERMS_URL = 'https://suliv.app/termos';

@Injectable()
export class TermsService {
  getCurrent(): CurrentTermsDto {
    return {
      version: process.env.TERMS_CURRENT_VERSION ?? CURRENT_TERMS_VERSION,
      url: process.env.TERMS_CURRENT_URL ?? CURRENT_TERMS_URL,
    };
  }
}
