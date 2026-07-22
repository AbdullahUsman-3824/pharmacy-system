import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { CreateSaleInput, SaleType } from '@repo/shared';

import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto implements CreateSaleInput {
  @IsEnum(SaleType)
  type!: SaleType;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsDateString()
  saleDate!: string;

  @ValidateIf((dto: CreateSaleDto) => dto.type === SaleType.SALE_RETURN)
  @IsUUID()
  originalSaleId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];
}
