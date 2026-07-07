import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { LookupsService } from './lookups.service';

const TYPE_MAP: Record<
  string,
  'company' | 'productType' | 'productGroup' | 'generic'
> = {
  companies: 'company',
  types: 'productType',
  groups: 'productGroup',
  generics: 'generic',
};

@Controller('lookups/:type')
export class LookupsController {
  constructor(private lookupsService: LookupsService) {}

  private resolveType(type: string) {
    const resolved = TYPE_MAP[type];
    if (!resolved) {
      throw new NotFoundException(`Unknown lookup type: ${type}`);
    }
    return resolved;
  }

  @Get()
  findAll(@Param('type') type: string) {
    return this.lookupsService.findAll(this.resolveType(type));
  }

  @Post()
  create(
    @Param('type') type: string,
    @Body() body: { code: string; name: string },
  ) {
    return this.lookupsService.create(this.resolveType(type), body);
  }

  @Put(':id')
  update(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { code?: string; name?: string },
  ) {
    return this.lookupsService.update(this.resolveType(type), id, body);
  }

  @Delete(':id')
  remove(@Param('type') type: string, @Param('id') id: string) {
    return this.lookupsService.softDelete(this.resolveType(type), id);
  }
}
