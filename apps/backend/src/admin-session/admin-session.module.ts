import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminSessionService } from './admin-session.service';
import { AdminSessionController } from './admin-session.controller';
import { AdminSessionGuard } from './admin-session.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AdminSessionController],
  providers: [AdminSessionService, AdminSessionGuard],
  exports: [AdminSessionService, AdminSessionGuard, JwtModule],
})
export class AdminSessionModule {}
