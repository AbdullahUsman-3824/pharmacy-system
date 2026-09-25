import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSessionModule } from '../admin-session/admin-session.module';

@Module({
  imports: [AdminSessionModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UserModule {}
