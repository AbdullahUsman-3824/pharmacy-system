import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CreateStockVoucherInput, StockVoucherType } from '@repo/shared';

import { StockVoucherItemDto } from './stock-voucher-item.dto';

export class CreateStockVoucherDto implements CreateStockVoucherInput {
  @IsEnum(StockVoucherType)
  type!: StockVoucherType;

  @IsOptional()
  @IsString()
  supplierId?: string | null;

  @IsDateString()
  voucherDate!: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockVoucherItemDto)
  items!: StockVoucherItemDto[];
}
