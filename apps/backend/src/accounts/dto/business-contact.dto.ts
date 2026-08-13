// business-contact.dto.ts
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  BusinessContactType,
  CreateBusinessContact,
  UpdateBusinessContact,
} from '@repo/shared';

export class CreateBusinessContactDto implements CreateBusinessContact {
  @IsString()
  name!: string;

  @IsEnum(BusinessContactType)
  type!: BusinessContactType;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBusinessContactDto
  extends PartialType(CreateBusinessContactDto)
  implements UpdateBusinessContact {}
