import { IsEnum, IsOptional, IsIn } from 'class-validator';
import { BaseListDto } from '../../common/base-list.dto';
import {
  StockVoucherSortField,
  StockVoucherListQuery,
  StockVoucherType,
} from '@repo/shared';

export class VoucherListQueryDto
  extends BaseListDto
  implements StockVoucherListQuery
{
  @IsOptional()
  @IsEnum(StockVoucherSortField)
  sortBy?: StockVoucherSortField;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(StockVoucherType)
  type?: StockVoucherType;
}
