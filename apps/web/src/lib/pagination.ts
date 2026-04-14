export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function parsePaginationParams(query: {
  page?: string | string[];
  limit?: string | string[];
}): PaginationParams {
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const rawLimit = Array.isArray(query.limit) ? query.limit[0] : query.limit;

  const page = Math.max(1, parseInt(rawPage ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(rawLimit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );

  return { page, limit };
}

export function toPrismaSkipTake({ page, limit }: PaginationParams): {
  skip: number;
  take: number;
} {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  { page, limit }: PaginationParams,
): PaginatedResponse<T> {
  return {
    data: items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}
