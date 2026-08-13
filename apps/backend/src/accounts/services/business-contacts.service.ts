import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBusinessContactDto,
  UpdateBusinessContactDto,
} from '../dto/business-contact.dto';
import { BusinessContactType } from '@repo/shared';
import { Prisma } from '../../generated/prisma/browser';

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

  async findAll(filters: {
    type?: BusinessContactType;
    search?: string;
    isActive?: boolean;
  }) {
    const where: Prisma.BusinessContactWhereInput = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.businessContact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
