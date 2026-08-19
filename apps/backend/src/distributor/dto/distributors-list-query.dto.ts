import { BaseListDto } from '../../common/base-list.dto';
import { DistributorsListQuery } from '@repo/shared';

export class DistributorListQueryDto
  extends BaseListDto
  implements DistributorsListQuery {}
