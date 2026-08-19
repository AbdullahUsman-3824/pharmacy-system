import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsListQuery, ProductsListResponse } from '@repo/shared';
import { buildPagination } from '../common/pagination.helper';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
    });
  }

  async findAll(query: ProductsListQuery = {}): Promise<ProductsListResponse> {
    const { skip, take, page, pageSize } = buildPagination(query);
    const search = query.search?.trim();
    const isSearching = !!search && search.length >= 2;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(isSearching && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { company: { name: { contains: search, mode: 'insensitive' } } },
          { type: { name: { contains: search, mode: 'insensitive' } } },
          { generic: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          company: true,
          type: true,
          group: true,
          generic: true,
        },
        // orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);
    const data: ProductsListResponse['data'] = products.map((product) => ({
      id: product.id,
      name: product.name,
      company: product.company.name,
      type: product.type.name,
      group: product.group?.name ?? '',
      generic: product.generic?.name ?? '',
      retailPrice: product.retailPrice?.toNumber() ?? undefined,
    }));

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        company: true,
        type: true,
        group: true,
        generic: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async search(query: string, limit = 20) {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { generic: { name: { contains: query, mode: 'insensitive' } } },
          { company: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        company: true,
        type: true,
        group: true,
        generic: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
