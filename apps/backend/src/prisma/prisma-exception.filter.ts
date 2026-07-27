import {
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        const fields =
          (exception.meta?.target as string[] | undefined) ??
          (
            exception.meta as {
              driverAdapterError?: {
                cause?: {
                  constraint?: {
                    fields?: string[];
                  };
                };
              };
            }
          )?.driverAdapterError?.cause?.constraint?.fields;

        throw new ConflictException({
          message: 'Duplicate value.',
          fields,
        });
      }
      case 'P2003':
        throw new BadRequestException('Invalid reference.');

      case 'P2025':
        throw new NotFoundException('Record not found.');

      default:
        throw exception;
    }
  }
}
