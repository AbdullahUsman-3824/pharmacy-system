import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  getSettings() {
    return this.systemSettingsService.getSettings();
  }

  @Patch()
  updateSettings(@Body() dto: UpdateSystemSettingsDto) {
    return this.systemSettingsService.updateSettings(dto);
  }
}
