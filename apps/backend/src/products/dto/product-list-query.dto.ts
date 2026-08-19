import { BaseListDto } from '../../common/base-list.dto';
import { ProductsListQuery } from '@repo/shared';

export class ProductListQueryDto
  extends BaseListDto
  implements ProductsListQuery {}
