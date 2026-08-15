import { IsString, IsUUID, MinLength } from 'class-validator';

export class VerifyPinDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MinLength(4)
  pin!: string;
}
