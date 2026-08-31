import { Module } from '@nestjs/common';
import { StockController } from './stocks.controller';
import { StockService } from './stocks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from '../user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [StockController],
  providers: [StockService, UsersService],
})
export class StocksModule {}
