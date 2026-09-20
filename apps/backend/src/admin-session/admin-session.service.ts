import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AdminPinDto } from './dto/admin-pin.dto';

@Injectable()
export class AdminSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async unlock(adminPin: AdminPinDto, res: Response) {
    // 1. Fetch the designated user with name "admin"
    const admin = await this.prisma.user.findFirst({
      where: { name: 'admin' },
      select: {
        id: true,
        name: true,
        pin: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin user not found or inactive');
    }

    // 2. Match the PIN (plain text – not hashed)
    if (admin.pin !== adminPin.pin) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // 3. Sign JWT
    const now = Math.floor(Date.now() / 1000); // seconds
    const exp = now + 30 * 60; // +30 minutes

    const payload = {
      adminUserId: admin.id,
      iat: now,
      exp,
    };

    const token = this.jwtService.sign(payload);

    // 4. Set httpOnly cookie
    res.cookie('adminSession', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 30 * 60 * 1000,
      path: '/',
    });

    // 5. Return unlockedUntil so frontend can show a countdown
    return {
      unlockedUntil: exp * 1000, // milliseconds
    }; 
  }

  lock(res: Response) {
    res.clearCookie('adminSession', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    return { locked: true };
  }

  async status(req: Request) {
    const token = req.cookies?.['adminSession'];

    if (!token) {
      return { unlocked: false, unlockedUntil: null };
    }

    try {
      const payload = this.jwtService.verify<{
        adminUserId: string;
        iat: number;
        exp: number;
      }>(token);

      // Optional: confirm the admin user still exists & is active
      const admin = await this.prisma.user.findFirst({
        where: {
          id: payload.adminUserId,
          name: 'admin',
          isActive: true,
        },
        select: { id: true },
      });

      if (!admin) {
        return { unlocked: false, unlockedUntil: null };
      }

      return {
        unlocked: true,
        unlockedUntil: payload.exp * 1000,
        adminUserId: payload.adminUserId,
      };
    } catch {
      // expired / invalid token
      return { unlocked: false, unlockedUntil: null };
    }
  }
}
