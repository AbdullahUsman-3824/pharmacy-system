// payment-accounts.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePaymentAccountDto,
  UpdatePaymentAccountDto,
} from '../dto/payment-account.dto';
import { PaymentAccountType } from '@repo/shared';
import { Prisma } from '../../generated/prisma/browser';

@Injectable()
export class PaymentAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCashAccount() {
    const account = await this.prisma.paymentAccount.findFirst({
      where: {
        type: PaymentAccountType.CASH,
        isActive: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Cash payment account not configured');
    }

    return account;
  }

  async getAvailableAccounts() {
    const [cash, banks] = await Promise.all([
      this.prisma.paymentAccount.findFirst({
        where: {
          type: PaymentAccountType.CASH,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      }),

      this.prisma.paymentAccount.findMany({
        where: {
          type: PaymentAccountType.BANK,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    if (!cash) {
      throw new NotFoundException(
        'Cash in hand payment account is not configured',
      );
    }

    return {
      cash,
      banks,
    };
  }

  async addBankAccount(dto: CreatePaymentAccountDto) {
    return this.prisma.paymentAccount.create({
      data: {
        name: dto.name,
        type: PaymentAccountType.BANK,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllBanks(filters: { isActive?: boolean }) {
    const where: Prisma.PaymentAccountWhereInput = {
      type: PaymentAccountType.BANK,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.paymentAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.paymentAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Payment account with ID ${id} not found`);
    }

    return account;
  }

  async update(id: string, dto: UpdatePaymentAccountDto) {
    const account = await this.findOne(id);

    // Cash is immutable
    if (account.type === (PaymentAccountType.CASH as string)) {
      throw new BadRequestException(
        'Cash in hand is managed by the system and cannot be modified',
      );
    }

    return this.prisma.paymentAccount.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const account = await this.findOne(id);

    // Cash cannot be deleted by users
    if (account.type === (PaymentAccountType.CASH as string)) {
      throw new BadRequestException(
        'Cash account is managed by the system and cannot be deleted',
      );
    }

    return this.prisma.paymentAccount.delete({
      where: { id },
    });
  }
}
