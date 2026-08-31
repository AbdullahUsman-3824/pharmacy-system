import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from '../user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [SalesController],
  providers: [SalesService, UsersService],
})
export class SalesModule {}
