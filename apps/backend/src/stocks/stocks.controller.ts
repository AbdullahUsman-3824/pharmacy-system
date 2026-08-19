import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StockService } from './stocks.service';
import { CreateStockVoucherDto } from './dto/create-stock-voucher.dto';
import { InventoryListQueryDto } from './dto/inventory-list-query.dto';
import { VoucherListQueryDto } from './dto/voucher-list-query.dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('vouchers')
  createVoucher(@Body() dto: CreateStockVoucherDto) {
    return this.stockService.createVoucher(dto);
  }

  @Get('vouchers')
  findAllVouchers(@Query() query: VoucherListQueryDto) {
    return this.stockService.findAllVouchers(query);
  }

  @Get('vouchers/:id')
  findOneVoucher(@Param('id') id: string) {
    return this.stockService.findOneVoucher(id);
  }

  @Get('products/:productId')
  getProductStock(@Param('productId') productId: string) {
    return this.stockService.getProductStock(productId);
  }

  @Get('inventory')
  getInventory(@Query() query: InventoryListQueryDto) {
    return this.stockService.getInventoryList(query);
  }
}
