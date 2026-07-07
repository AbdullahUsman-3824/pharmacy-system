import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type LookupType = 'company' | 'productType' | 'productGroup' | 'generic';

type LookupDelegate = {
  findMany: (args: {
    where?: { deletedAt: null };
    orderBy?: { name: 'asc' };
  }) => Promise<Record<string, unknown>[]>;
  findFirst: (args: {
    where: { id: string; deletedAt: null };
  }) => Promise<Record<string, unknown> | null>;
  create: (args: {
    data: { code: string; name: string };
  }) => Promise<Record<string, unknown>>;
  update: (args: {
    where: { id: string };
    data: { code?: string; name?: string; deletedAt?: Date };
  }) => Promise<Record<string, unknown>>;
};

@Injectable()
export class LookupsService {
  constructor(private prisma: PrismaService) {}

  private getDelegate(type: LookupType): LookupDelegate {
    switch (type) {
      case 'company':
        return this.prisma.company;
      case 'productType':
        return this.prisma.productType;
      case 'productGroup':
        return this.prisma.productGroup;
      case 'generic':
        return this.prisma.generic;
    }
  }

  findAll(type: LookupType) {
    return this.getDelegate(type).findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  create(type: LookupType, data: { code: string; name: string }) {
    return this.getDelegate(type).create({ data });
  }

  async update(
    type: LookupType,
    id: string,
    data: { code?: string; name?: string },
  ) {
    const existing = await this.getDelegate(type).findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`${type} not found`);
    return this.getDelegate(type).update({ where: { id }, data });
  }

  async softDelete(type: LookupType, id: string) {
    const existing = await this.getDelegate(type).findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`${type} not found`);
    return this.getDelegate(type).update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
