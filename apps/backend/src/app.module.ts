import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LookupsModule } from './lookups/lookups.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SupplierModule } from './suppliers/suppliers.module';
import { StocksModule } from './stocks/stocks.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    LookupsModule,
    PrismaModule,
    ProductsModule,
    SupplierModule,
    StocksModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
