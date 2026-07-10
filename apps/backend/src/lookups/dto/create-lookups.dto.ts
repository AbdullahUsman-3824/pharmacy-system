import { IsNotEmpty, IsString } from 'class-validator';
import { LookupInterface } from '@repo/shared';

export class CreateLookupDto implements LookupInterface {
  @IsString()
  @IsNotEmpty()
  code!: string;
  
  @IsString()
  @IsNotEmpty()
  name!: string;
}
