import { IsString, MinLength } from 'class-validator';

export class AdminPinDto {
  @IsString()
  @MinLength(4)
  pin!: string;
}
