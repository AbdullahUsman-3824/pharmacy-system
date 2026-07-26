import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        company: true,
        type: true,
        group: true,
        generic: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
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
