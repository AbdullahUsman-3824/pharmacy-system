import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AdminSessionService } from './admin-session.service';
import { AdminPinDto } from './dto/admin-pin.dto';

@Controller('admin-session')
export class AdminSessionController {
  constructor(private readonly adminSessionService: AdminSessionService) {}

  @Post('unlock')
  @HttpCode(200)
  unlock(
    @Body() adminPin: AdminPinDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.adminSessionService.unlock(adminPin, res);
  }

  @Post('lock')
  @HttpCode(200)
  lock(@Res({ passthrough: true }) res: Response) {
    return this.adminSessionService.lock(res);
  }

  @Get('status')
  status(@Req() req: Request) {
    return this.adminSessionService.status(req);
  }
}
