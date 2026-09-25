import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { SystemSettings } from '../generated/prisma/client';

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<SystemSettings> {
    let settings = await this.prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {},
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateSystemSettingsDto): Promise<SystemSettings> {
    const existing = await this.getSettings();

    return this.prisma.systemSettings.update({
      where: { id: existing.id },
      data: {
        ...dto,
        gstRate: dto.gstRate !== undefined ? dto.gstRate : undefined,
      },
    });
  }
}
