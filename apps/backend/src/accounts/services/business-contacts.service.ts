import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBusinessContactDto,
  UpdateBusinessContactDto,
} from '../dto/business-contact.dto';
import {
  BusinessContactType,
  AccountsListQuery,
  AccountsListResponse,
} from '@repo/shared';
import { Prisma } from '../../generated/prisma/browser';
import { buildPagination } from '../../common/pagination.helper';

@Injectable()
export class BusinessContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBusinessContactDto) {
    return this.prisma.businessContact.create({
      data: {
        name: dto.name,
        type: dto.type,
        phone: dto.phone,
        address: dto.address,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(query: AccountsListQuery = {}): Promise<AccountsListResponse> {
    const { skip, take, page, pageSize } = buildPagination(query);
    const search = query.search?.trim();
    const isSearching = !!search && search.length >= 2;

    const where: Prisma.BusinessContactWhereInput = {
      ...(query.type && { type: query.type }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(isSearching && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      this.prisma.businessContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.businessContact.count({ where }),
    ]);

    console.log('Accounts query:', query);
    console.log('Prisma where:', JSON.stringify(where));

    const data: AccountsListResponse['data'] = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type as BusinessContactType,
      phone: c.phone ?? undefined,
      address: c.address ?? undefined,
      isActive: c.isActive,
    }));

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
  async findSupplierOptions(
    search: string,
  ): Promise<{ id: string; name: string }[]> {
    const trimmedSearch = search.trim();

    if (trimmedSearch.length < 2) {
      return [];
    }

    return this.prisma.businessContact.findMany({
      where: {
        name: {
          contains: trimmedSearch,
          mode: 'insensitive',
        },
        type: BusinessContactType.SUPPLIER,
      },
      take: 20,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
  async findCustomerOptions(
    search: string,
  ): Promise<{ id: string; name: string }[]> {
    const trimmedSearch = search.trim();

    if (trimmedSearch.length < 2) {
      return [];
    }

    return this.prisma.businessContact.findMany({
      where: {
        name: {
          contains: trimmedSearch,
          mode: 'insensitive',
        },
        type: BusinessContactType.CUSTOMER,
      },
      take: 20,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.businessContact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException(`Business contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(id: string, dto: UpdateBusinessContactDto) {
    await this.findOne(id); // throws if not found

    return this.prisma.businessContact.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // throws if not found

    return this.prisma.businessContact.delete({
      where: { id },
    });
  }
}
