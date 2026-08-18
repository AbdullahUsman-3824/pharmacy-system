import { IsEnum, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseListDto } from '../../common/base-list.dto';
import { SalesListQuery, SaleSortField, SaleType } from '@repo/shared';

export class SalesListQueryDto extends BaseListDto implements SalesListQuery {
  @IsOptional()
  @IsEnum(SaleSortField)
  sortBy?: SaleSortField;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsEnum(SaleType, { each: true })
  types?: SaleType[];
}
