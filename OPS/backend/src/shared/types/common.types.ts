export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
    path?: string;
  };
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
}

export interface PaginationParams {
  skip?: number;
  take?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
