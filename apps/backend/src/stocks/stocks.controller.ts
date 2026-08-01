import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StockService } from './stocks.service';
import { CreateStockVoucherDto } from './dto/create-stock-voucher.dto';
import { InventoryListQueryDto } from './dto/inventory-list-query.dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('vouchers')
  createVoucher(@Body() dto: CreateStockVoucherDto) {
    return this.stockService.createVoucher(dto);
  }

  @Get('vouchers')
  findAllVouchers() {
    return this.stockService.findAll();
  }

  @Get('vouchers/:id')
  findOne(@Param('id') id: string) {
    return this.stockService.findOne(id);
  }

  @Get('products/:productId/stock')
  getProductStock(@Param('productId') productId: string) {
    return this.stockService.getProductStock(productId);
  }

  @Get('inventory')
  getInventory(@Query() query: InventoryListQueryDto) {
    return this.stockService.getInventoryList(query);
  }
}
