import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserType } from '@repo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    name: true,
    type: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.UserSelect;

  async findAll(filters: { type?: UserType; search?: string }) {
    const { type, search } = filters;
    return this.prisma.user.findMany({
      where: {
        type,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { id: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} was not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          pin: createUserDto.pin,
          type: createUserDto.type,
          isActive: createUserDto.isActive ?? true,
        },
        select: this.userSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException('Unable to create user');
      }

      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.name !== undefined && {
          name: updateUserDto.name,
        }),
        ...(updateUserDto.pin !== undefined && {
          pin: updateUserDto.pin,
        }),
        ...(updateUserDto.type !== undefined && {
          type: updateUserDto.type,
        }),
        ...(updateUserDto.isActive !== undefined && {
          isActive: updateUserDto.isActive,
        }),
      },
      select: this.userSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'User deleted successfully',
      id,
    };
  }
}
