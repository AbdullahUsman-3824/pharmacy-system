import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LookupInterface, LookupType } from '@repo/shared';
import { CreateLookupDto } from './dto/create-lookups.dto';
import { UpdateLookupDto } from './dto/update-lookups.dto';

type LookupDelegate = {
  findMany: (args: {
    where?: { deletedAt: null };
    orderBy?: { name: 'asc' };
  }) => Promise<Record<string, unknown>[]>;
  findFirst: (args: {
    where: { id: string; deletedAt: null } | { code: string };
  }) => Promise<Record<string, unknown> | null>;
  create: (args: { data: CreateLookupDto }) => Promise<Record<string, unknown>>;
  update: (args: {
    where: { id: string };
    data: UpdateLookupDto;
  }) => Promise<Record<string, unknown>>;
};

@Injectable()
export class LookupsService {
  constructor(private prisma: PrismaService) {}

  private getDelegate(type: LookupType): LookupDelegate {
    switch (type) {
      case LookupType.Company:
        return this.prisma.company;

      case LookupType.ProductType:
        return this.prisma.productType;

      case LookupType.ProductGroup:
        return this.prisma.productGroup;

      case LookupType.Generic:
        return this.prisma.generic;
    }
  }

  private deriveCode(name: string): string {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .slice(0, 10);
  }

  private async ensureUniqueCode(
    type: LookupType,
    baseCode: string,
  ): Promise<string> {
    const delegate = this.getDelegate(type);
    let code = baseCode;
    let suffix = 1;

    while (await delegate.findFirst({ where: { code } })) {
      suffix += 1;
      code = `${baseCode}-${suffix}`;
    }

    return code;
  }

  findAll(type: LookupType) {
    return this.getDelegate(type).findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async create(type: LookupType, data: LookupInterface) {
    const baseCode = this.deriveCode(data.name);
    const code = await this.ensureUniqueCode(type, baseCode);

    return this.getDelegate(type).create({
      data: { ...data, code },
    });
  }

  async update(type: LookupType, id: string, data: UpdateLookupDto) {
    const delegate = this.getDelegate(type);
    const existing = await delegate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`${type} not found`);
    return delegate.update({ where: { id }, data });
  }

  async softDelete(type: LookupType, id: string) {
    const delegate = this.getDelegate(type);
    const existing = await delegate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`${type} not found`);
    return delegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
