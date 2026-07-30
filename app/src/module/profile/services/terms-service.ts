const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface CurrentTerms {
  version: string;
  url: string;
}

export class TermsServiceError extends Error {
  constructor(readonly status: number) {
    super(`Terms request failed with status ${status}.`);
  }
}

export interface TermsService {
  getCurrentTerms(): Promise<CurrentTerms>;
}

export const termsService: TermsService = {
  async getCurrentTerms() {
    const response = await fetch(`${API_BASE_URL}/terms/current`);
    if (!response.ok) {
      throw new TermsServiceError(response.status);
    }
    return response.json() as Promise<CurrentTerms>;
  },
};
