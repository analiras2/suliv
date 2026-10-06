import { apiRequestJson } from '@/lib/api-client';

export interface CurrentTerms {
  version: string;
  url: string;
}

export interface TermsService {
  getCurrentTerms(): Promise<CurrentTerms>;
}

export const termsService: TermsService = {
  getCurrentTerms: () => apiRequestJson<CurrentTerms>('/terms/current', { auth: 'none' }),
};
