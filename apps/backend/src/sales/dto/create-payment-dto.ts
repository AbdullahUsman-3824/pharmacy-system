import { IsUUID, IsNumber, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  paymentAccountId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
}
