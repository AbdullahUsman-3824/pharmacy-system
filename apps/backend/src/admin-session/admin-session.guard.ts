import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['adminSession'];

    if (!token) {
      throw new UnauthorizedException({
        code: 'ADMIN_LOCKED',
        message: 'Admin session required',
      });
    }

    try {
      const payload = this.jwtService.verify<{
        adminUserId: string;
        iat: number;
        exp: number;
      }>(token);

      // Extra safety: confirm the admin user still exists & is active
      const admin = await this.prisma.user.findFirst({
        where: {
          id: payload.adminUserId,
          name: 'admin',
          isActive: true,
        },
        select: { id: true },
      });

      if (!admin) {
        throw new UnauthorizedException({
          code: 'ADMIN_LOCKED',
          message: 'Admin session invalid',
        });
      }

      // Attach to request if you ever need it later
      (request as any).adminUserId = payload.adminUserId;

      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'ADMIN_LOCKED',
        message: 'Admin session expired or invalid',
      });
    }
  }
}
