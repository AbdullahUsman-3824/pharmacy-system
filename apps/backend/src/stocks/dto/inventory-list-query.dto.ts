// inventory-list-query.dto.ts
import { Transform } from 'class-transformer';
import { IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class InventoryListQueryDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  lowStockOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  outOfStockOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  nearExpiryOnly?: boolean;

  @IsOptional()
  groupId?: string;

  @IsOptional()
  typeId?: string;

  @IsOptional()
  @IsIn(['name', 'totalQuantity', 'nearestExpiryDate', 'retailRate'])
  sortBy?: 'name' | 'totalQuantity' | 'nearestExpiryDate' | 'retailRate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize?: number;
}
