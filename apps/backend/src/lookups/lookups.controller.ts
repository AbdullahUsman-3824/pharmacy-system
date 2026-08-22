import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { LookupType } from '@repo/shared';
import { LookupsService } from './lookups.service';
import { CreateLookupDto } from './dto/create-lookups.dto';
import { UpdateLookupDto } from './dto/update-lookups.dto';
import { LookupsListQueryDto } from './dto/lookups-list-query.dto';
import { LookupTypePipe } from './pipes/lookup-type.pipe';

@Controller('lookups/:type')
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get()
  findAll(
    @Param('type', LookupTypePipe) type: LookupType,
    @Query() query: LookupsListQueryDto,
  ) {
    return this.lookupsService.findAll(type, query);
  }

  @Get('options')
  findOptions(
    @Param('type', LookupTypePipe) type: LookupType,
    @Query('search') search: string,
  ) {
    return this.lookupsService.findOptions(type, search);
  }

  @Post()
  create(
    @Param('type', LookupTypePipe) type: LookupType,
    @Body() body: CreateLookupDto,
  ) {
    return this.lookupsService.create(type, body);
  }

  @Put(':id')
  update(
    @Param('type', LookupTypePipe) type: LookupType,
    @Param('id') id: string,
    @Body() body: UpdateLookupDto,
  ) {
    return this.lookupsService.update(type, id, body);
  }

  @Delete(':id')
  remove(
    @Param('type', LookupTypePipe) type: LookupType,
    @Param('id') id: string,
  ) {
    return this.lookupsService.softDelete(type, id);
  }
}
