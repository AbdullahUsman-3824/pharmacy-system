import { PaginationQuery, SortQuery } from '@repo/shared';

export function buildPagination(query: PaginationQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

export function buildOrderBy<T extends string>(
  query: SortQuery<T>,
  defaultField: T,
  fieldMap: Record<T, object>,
): object {
  const field = query.sortBy ?? defaultField;
  return fieldMap[field];
}

export function withOrder(shape: object, order: 'asc' | 'desc'): object {
  const result: Record<string, unknown> = {};
  for (const key in shape) {
    const val = (shape as any)[key];
    result[key] = val === undefined ? order : withOrder(val, order);
  }
  return result;
}
