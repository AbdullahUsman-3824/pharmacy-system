import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SaleService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sale')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.saleService.createSale(dto);
  }

  @Get()
  findAll() {
    return this.saleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleService.findOne(id);
  }
}
