import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StockService } from './stocks.service';
import { CreateStockVoucherDto } from './dto/create-stock-voucher.dto';

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
}
