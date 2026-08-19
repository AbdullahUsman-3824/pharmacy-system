import { BaseListDto } from '../../common/base-list.dto';
import { LookupsListQuery } from '@repo/shared';

export class LookupsListQueryDto
  extends BaseListDto
  implements LookupsListQuery {}
