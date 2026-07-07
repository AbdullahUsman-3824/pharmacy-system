import {
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        throw new ConflictException('A record with this value already exists.');

      case 'P2003':
        throw new BadRequestException('Invalid reference.');

      case 'P2025':
        throw new NotFoundException('Record not found.');

      default:
        throw exception;
    }
  }
}
