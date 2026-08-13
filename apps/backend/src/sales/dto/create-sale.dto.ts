import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { CreatePaymentDto, CreateSaleInput, SaleType } from '@repo/shared';

import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto implements CreateSaleInput {
  @IsEnum(SaleType)
  type!: SaleType;

  @IsOptional()
  @IsString()
  customerId!: string;

  @IsDateString()
  saleDate!: string;

  @ValidateIf((dto: CreateSaleDto) => dto.type === SaleType.SALE_RETURN)
  @IsUUID()
  originalSaleId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments!: CreatePaymentDto[];
}
