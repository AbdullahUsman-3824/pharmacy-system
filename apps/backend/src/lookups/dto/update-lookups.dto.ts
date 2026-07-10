import { PartialType } from '@nestjs/mapped-types';
import { CreateLookupDto } from './create-lookups.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateLookupDto extends PartialType(CreateLookupDto) {
  @IsOptional()
  @IsDateString()
  deletedAt?: Date;
}
