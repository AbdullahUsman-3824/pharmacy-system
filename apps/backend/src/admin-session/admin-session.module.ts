import { Module } from '@nestjs/common';
import { AdminSessionService } from './admin-session.service';
import { AdminSessionController } from './admin-session.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AdminSessionController],
  providers: [AdminSessionService],
})
export class AdminSessionModule {}
