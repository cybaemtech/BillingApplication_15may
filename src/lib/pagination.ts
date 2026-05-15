export const FIXED_PAGE_SIZE = 10;

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    start: number;
    end: number;
  };
};

export const emptyPaginatedResponse = <T>(): PaginatedResponse<T> => ({
  data: [],
  pagination: {
    page: 1,
    limit: FIXED_PAGE_SIZE,
    total: 0,
    totalPages: 0,
    start: 0,
    end: 0,
  },
});

export function paginateArray<T>(items: T[], page: number, limit = FIXED_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const startIndex = (safePage - 1) * limit;
  const data = items.slice(startIndex, startIndex + limit);

  return {
    data,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      start: total === 0 ? 0 : startIndex + 1,
      end: total === 0 ? 0 : Math.min(startIndex + data.length, total),
    },
  };
}
