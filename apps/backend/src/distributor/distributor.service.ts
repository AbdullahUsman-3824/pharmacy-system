import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistributorDto } from './dto/create-distributor.dto';
import { UpdateDistributorDto } from './dto/update-distributor.dto';

@Injectable()
export class DistributorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDistributorDto) {
    return this.prisma.distributor.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.distributor.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
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
