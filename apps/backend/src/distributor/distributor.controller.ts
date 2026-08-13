import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DistributorService } from './distributor.service';
import { CreateDistributorDto } from './dto/create-distributor.dto';
import { UpdateDistributorDto } from './dto/update-distributor.dto';

@Controller('distributors')
export class DistributorController {
  constructor(private readonly distributorService: DistributorService) {}

  @Post()
  create(@Body() createDistributorDto: CreateDistributorDto) {
    return this.distributorService.create(createDistributorDto);
  }

  @Get()
  findAll() {
    return this.distributorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.distributorService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDistributorDto: UpdateDistributorDto,
  ) {
    return this.distributorService.update(id, updateDistributorDto);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.distributorService.softDelete(id);
  }
}
