import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BusinessContactsService } from '../services/business-contacts.service';
import {
  CreateBusinessContactDto,
  UpdateBusinessContactDto,
} from '../dto/business-contact.dto';
import { AccountsListQueryDto } from '../dto/accounts-list-query.dto';

@Controller('business-contacts')
export class BusinessContactsController {
  constructor(
    private readonly businessContactsService: BusinessContactsService,
  ) {}

  @Post()
  create(@Body() createBusinessContactDto: CreateBusinessContactDto) {
    return this.businessContactsService.create(createBusinessContactDto);
  }

  @Get()
  findAll(@Query() query: AccountsListQueryDto) {
    return this.businessContactsService.findAll(query);
  }

  @Get('suppliers/options')
  findSupplierOptions(@Query('search') search: string) {
    return this.businessContactsService.findSupplierOptions(search);
  }

  @Get('customers/options')
  findCustomerOptions(@Query('search') search: string) {
    return this.businessContactsService.findCustomerOptions(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessContactsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBusinessContactDto: UpdateBusinessContactDto,
  ) {
    return this.businessContactsService.update(id, updateBusinessContactDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessContactsService.remove(id);
  }
}
