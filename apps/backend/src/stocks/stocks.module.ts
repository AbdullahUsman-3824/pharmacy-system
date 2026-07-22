import { Module } from '@nestjs/common';
import { StockController } from './stocks.controller';
import { StockService } from './stocks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StockController],
  providers: [StockService],
})
export class StocksModule {}
