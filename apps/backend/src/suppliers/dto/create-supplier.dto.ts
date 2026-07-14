import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateSupplierInput } from '@repo/shared';

export class CreateSupplierDto implements CreateSupplierInput {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
