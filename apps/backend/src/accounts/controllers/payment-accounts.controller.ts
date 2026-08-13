// payment-accounts.controller.ts
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
import { PaymentAccountsService } from '../services/payment-accounts.service';
import {
  CreatePaymentAccountDto,
  UpdatePaymentAccountDto,
} from '../dto/payment-account.dto';

@Controller('payment-accounts')
export class PaymentAccountsController {
  constructor(
    private readonly paymentAccountsService: PaymentAccountsService,
  ) {}

  @Post()
  create(@Body() createPaymentAccountDto: CreatePaymentAccountDto) {
    return this.paymentAccountsService.addBankAccount(createPaymentAccountDto);
  }

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    const isActiveBool =
      isActive === undefined ? undefined : isActive === 'true';

    return this.paymentAccountsService.findAllBanks({
      isActive: isActiveBool,
    });
  }

  @Get('cash')
  getCashAccount() {
    return this.paymentAccountsService.getCashAccount();
  }

  @Get('available')
  getAvailableAccounts() {
    return this.paymentAccountsService.getAvailableAccounts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentAccountsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentAccountDto: UpdatePaymentAccountDto,
  ) {
    return this.paymentAccountsService.update(id, updatePaymentAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentAccountsService.remove(id);
  }
}
