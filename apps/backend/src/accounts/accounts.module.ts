import { Module } from '@nestjs/common';
import { BusinessContactsController } from './controllers/business-contacts.controller';
import { BusinessContactsService } from './services/business-contacts.service';
import { PaymentAccountsController } from './controllers/payment-accounts.controller';
import { PaymentAccountsService } from './services/payment-accounts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentAccountsController, BusinessContactsController],
  providers: [PaymentAccountsService, BusinessContactsService],
})
export class AccountsModule {}
