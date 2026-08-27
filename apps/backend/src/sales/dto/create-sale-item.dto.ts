import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';
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

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  grossAmount!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  netAmount!: number;
}
