import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { LookupType } from '@repo/shared';

@Injectable()
export class LookupTypePipe implements PipeTransform<string, LookupType> {
  transform(value: string): LookupType {
    if (!Object.values(LookupType).includes(value as LookupType)) {
      throw new BadRequestException(
        `Invalid lookup type. Allowed values: ${Object.values(LookupType).join(', ')}`,
      );
    }

    return value as LookupType;
  }
}
