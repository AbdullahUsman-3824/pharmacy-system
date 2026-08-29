import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StockVoucherItemInput } from '@repo/shared';

export class StockVoucherItemDto implements StockVoucherItemInput {
  @IsString()
  productId!: string;

  @IsString()
  batchNumber!: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;

  /** Full packs — can be 0 if only loose is entered */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  packQuantity!: number;

  /** Loose units — can be 0 if only packs are entered */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  looseQuantity!: number;

  /** Free units (no rate / amount impact) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  freeQuantity?: number;

  /** Purchase rate per pack */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchaseRate!: number;

  /** Sale rate per pack */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  saleRate!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  grossAmount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  netAmount!: number;

  @IsOptional()
  @IsBoolean()
  confirmRateUpdate?: boolean;
}
