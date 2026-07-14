import { Module } from '@nestjs/common';
import { SupplierService } from './suppliers.service';
import { SupplierController } from './suppliers.controller';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
})
export class SupplierModule {}
