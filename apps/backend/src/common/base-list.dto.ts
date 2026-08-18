import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BaseListQuery } from '@repo/shared';

export class BaseListDto implements BaseListQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pageSize?: number = 20;

  @IsOptional() @IsString()
  search?: string;
}