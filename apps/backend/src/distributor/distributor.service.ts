import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistributorDto } from './dto/create-distributor.dto';
import { UpdateDistributorDto } from './dto/update-distributor.dto';
import type {
  DistributorsListQuery,
  DistributorsListResponse,
} from '@repo/shared';
import { buildPagination } from '../common/pagination.helper';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class DistributorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDistributorDto) {
    return this.prisma.distributor.create({
      data: dto,
    });
  }

  async findAll(
    query: DistributorsListQuery = {},
  ): Promise<DistributorsListResponse> {
    const { skip, take, page, pageSize } = buildPagination(query);
    const search = query.search?.trim();
    const isSearching = !!search && search.length >= 2;

    const where: Prisma.DistributorWhereInput = {
      deletedAt: null,
      ...(isSearching && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [distributors, total] = await Promise.all([
      this.prisma.distributor.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.distributor.count({ where }),
    ]);

    const data: DistributorsListResponse['data'] = distributors.map((d) => ({
      id: d.id,
      name: d.name,
      contactPerson: d.contactPerson ?? undefined,
      phone: d.phone ?? undefined,
      email: d.email ?? undefined,
      city: d.city ?? undefined,
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOptions(search: string): Promise<{ id: string; name: string }[]> {
    const trimmedSearch = search.trim();

    if (trimmedSearch.length < 2) {
      return [];
    }

    return this.prisma.distributor.findMany({
      where: {
        deletedAt: null,
        name: {
          contains: trimmedSearch,
          mode: 'insensitive',
        },
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
    const distributor = await this.prisma.distributor.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!distributor) {
      throw new NotFoundException('Distributor not found');
    }

    return distributor;
  }

  async update(id: string, dto: UpdateDistributorDto) {
    await this.findOne(id);

    return this.prisma.distributor.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);

    return this.prisma.distributor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
