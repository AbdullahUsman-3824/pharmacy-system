import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }

  @Get()
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(100), ParseIntPipe) take: number,
  ) {
    return this.salesService.findAll({ skip, take });
  }

  @Get('search')
  searchSales(@Query('q') q: string) {
    return this.salesService.searchSales(q);
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
