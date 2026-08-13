// payment-account.dto.ts
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  PaymentAccountType,
  CreatePaymentAccount,
  UpdatePaymentAccount,
} from '@repo/shared';

export class CreatePaymentAccountDto implements CreatePaymentAccount {
  @IsString()
  name!: string;

  @IsEnum(PaymentAccountType)
  type!: PaymentAccountType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePaymentAccountDto
  extends PartialType(CreatePaymentAccountDto)
  implements UpdatePaymentAccount {}
