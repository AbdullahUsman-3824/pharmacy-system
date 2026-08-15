import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CreateUserInput, UserType } from '@repo/shared';

export class CreateUserDto implements CreateUserInput {
  @IsString()
  name!: string;

  @IsString()
  @MinLength(4)
  pin!: string;

  @IsEnum(UserType)
  type!: UserType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
