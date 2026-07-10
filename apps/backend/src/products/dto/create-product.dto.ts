import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductInput } from '@repo/shared';

export class CreateProductDto implements CreateProductInput {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  companyId!: string;

  @IsUUID()
  typeId!: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsUUID()
  genericId?: string;

  @IsOptional()
  @IsUUID()
  defaultSupplierId?: string;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsString()
  originalReference?: string;

  // Packing
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  packingSize!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  retailPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  retailDiscount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  tradePrice?: number;

  // Unit Rate

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  retailRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  tradeRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  counterRatePercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  orgRatePercent?: number;

  // Inventory

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shelfNo?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  nivFormulary?: boolean;
}
