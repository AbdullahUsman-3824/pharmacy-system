import { Module } from '@nestjs/common';
import { StockController } from './stocks.controller';
import { StockService } from './stocks.service';

@Module({
  controllers: [StockController],
  providers: [StockService]
})
export class StocksModule {}
