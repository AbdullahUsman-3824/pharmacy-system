import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesListQueryDto } from './dto/sales-list-query.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }

  @Get()
  findAll(@Query() query: SalesListQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get('product-options')
  getSaleProductOptions(@Query('search') search: string) {
    return this.salesService.getSaleProductOptions(search);
  }

  @Get('number/:saleNumber')
  findBySaleNumber(@Param('saleNumber') saleNumber: string) {
    return this.salesService.findBySaleNumber(saleNumber);
  }

  @Get(':id/returnable')
  getReturnableItems(@Param('id') id: string) {
    return this.salesService.getReturnableItems(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }
}
