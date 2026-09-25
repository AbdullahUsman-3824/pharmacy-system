import { IsString, MinLength } from 'class-validator';
import { UnlockAdminInput } from '@repo/shared';

export class AdminPinDto implements UnlockAdminInput {
  @IsString()
  @MinLength(4)
  pin!: string;
}
