import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateDistributorInput } from '@repo/shared';

export class CreateDistributorDto implements CreateDistributorInput {
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
