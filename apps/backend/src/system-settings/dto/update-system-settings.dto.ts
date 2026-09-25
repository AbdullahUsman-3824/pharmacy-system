import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  pharmacyName?: string;

  @IsOptional()
  @IsString()
  pharmacyAddress?: string;

  @IsOptional()
  @IsString()
  pharmacyPhone?: string;

  @IsOptional()
  @IsEmail()
  pharmacyEmail?: string;

  @IsOptional()
  @IsString()
  pharmacyLogo?: string;

  @IsOptional()
  @IsBoolean()
  gstEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  gstRate?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
