import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserType } from '@repo/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
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

  private async hashPin(pin: string): Promise<string> {
    return argon2.hash(pin, { type: argon2.argon2id });
  }

  async findAll(type?: UserType) {
    return this.prisma.user.findMany({
      where: type ? { type } : undefined,
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
      const hashedPin = await this.hashPin(createUserDto.pin);

      return await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          pin: hashedPin,
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

    const hashedPin =
      updateUserDto.pin !== undefined
        ? await this.hashPin(updateUserDto.pin)
        : undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.name !== undefined && {
          name: updateUserDto.name,
        }),
        ...(hashedPin !== undefined && {
          pin: hashedPin,
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

  async verifyPin(verifyPinDto: VerifyPinDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: verifyPinDto.userId },
    });

    if (!user || !user.isActive) {
      return {
        valid: false,
        userId: verifyPinDto.userId,
      };
    }

    const isValid = await argon2.verify(user.pin, verifyPinDto.pin);

    if (!isValid) {
      return {
        valid: false,
        userId: verifyPinDto.userId,
      };
    }

    return {
      valid: true,
      userId: user.id,
      name: user.name,
      type: user.type,
    };
  }
}