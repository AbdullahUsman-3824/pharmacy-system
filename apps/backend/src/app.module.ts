import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LookupsModule } from './lookups/lookups.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { DistributorModule } from './distributor/distributor.module';
import { StocksModule } from './stocks/stocks.module';
import { SalesModule } from './sales/sales.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    LookupsModule,
    PrismaModule,
    ProductsModule,
    DistributorModule,
    StocksModule,
    SalesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
