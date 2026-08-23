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
import { PaymentAccountType, PaymentOptions } from '@repo/shared';
import { Prisma } from '../../generated/prisma/browser';

@Injectable()
export class PaymentAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPaymentOptions(): Promise<PaymentOptions> {
    const [cash, banks] = await Promise.all([
      this.prisma.paymentAccount.findFirst({
        where: {
          type: PaymentAccountType.CASH,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
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

  async create(dto: CreatePaymentAccountDto) {
    const name = dto.name.trim().toUpperCase();

    return this.prisma.paymentAccount.create({
      data: {
        name: name,
        type: PaymentAccountType.BANK,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(filters: { isActive?: boolean }) {
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
    const name = dto.name?.trim().toUpperCase();
    return this.prisma.paymentAccount.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name }),
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
