// payment-account.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentAccount, UpdatePaymentAccount } from '@repo/shared';

export class CreatePaymentAccountDto implements CreatePaymentAccount {
  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePaymentAccountDto
  extends PartialType(CreatePaymentAccountDto)
  implements UpdatePaymentAccount {}
