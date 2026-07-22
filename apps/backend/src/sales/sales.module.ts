import { Module } from '@nestjs/common';
import { SaleController } from './sales.controller';
import { SaleService } from './sales.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SaleController],
  providers: [SaleService],
})
export class SaleModule {}
