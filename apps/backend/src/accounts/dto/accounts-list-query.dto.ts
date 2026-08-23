import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseListDto } from '../../common/base-list.dto';
import { BusinessContactType } from '@repo/shared';

export class AccountsListQueryDto extends BaseListDto {
  @IsOptional()
  @IsEnum(BusinessContactType)
  type?: BusinessContactType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
