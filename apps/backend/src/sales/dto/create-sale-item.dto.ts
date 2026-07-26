import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min, ValidateIf } from 'class-validator';
import { CreateSaleItemInput } from '@repo/shared';

export class CreateSaleItemDto implements CreateSaleItemInput {
  @IsString()
  productId!: string;

  @IsString()
  batchId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  packQuantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  saleRate!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  looseQuantity!: number;

  // Only required to be a meaningful rate if looseQuantity > 0 — still
  // validated as a number either way since the frontend always sends 0.
  @ValidateIf((dto: CreateSaleItemDto) => dto.looseQuantity > 0)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  looseRate!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  grossAmount!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  netAmount!: number;
}
