// payment-accounts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreatePaymentAccountDto) {
    return this.prisma.paymentAccount.create({
      data: {
        name: dto.name,
        type: dto.type,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(filters: { type?: PaymentAccountType; isActive?: boolean }) {
    const where: Prisma.PaymentAccountWhereInput = {};

    if (filters.type) {
      where.type = filters.type;
    }

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
    await this.findOne(id); // throws if not found

    return this.prisma.paymentAccount.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // throws if not found

    return this.prisma.paymentAccount.delete({
      where: { id },
    });
  }
}
