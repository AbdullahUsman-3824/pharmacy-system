export interface PaginationQuery {
  page?: number; // default 1
  pageSize?: number; // default 20 (or whatever your standard is)
}

export interface SearchQuery {
  search?: string;
}

export interface SortQuery<TSortField extends string> {
  sortBy?: TSortField;
  sortOrder?: "asc" | "desc";
}

// Every domain gets at least this
export interface BaseListQuery extends PaginationQuery, SearchQuery {}
