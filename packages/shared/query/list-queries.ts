import { BaseListQuery, SortQuery } from "./base";
import {
  SaleSortField,
  StockVoucherSortField,
  InventorySortField,
} from "./sort-fields";
import { SaleType } from "../types/sale";
import { StockVoucherType } from "../types/stock";
import { InventoryStatus } from "../types/inventory";
import { BusinessContactType } from "../types/accounts";

export interface SalesListQuery
  extends BaseListQuery, SortQuery<SaleSortField> {
  types?: SaleType[];
}

export interface StockVoucherListQuery
  extends BaseListQuery, SortQuery<StockVoucherSortField> {
  types?: StockVoucherType[];
}

export interface InventoryListQuery
  extends BaseListQuery, SortQuery<InventorySortField> {
  status?: InventoryStatus[];
}

export interface ProductsListQuery extends BaseListQuery {}
export interface DistributorsListQuery extends BaseListQuery {}
export interface LookupsListQuery extends BaseListQuery {}
export interface AccountsListQuery extends BaseListQuery {
  type?: BusinessContactType;
  isActive?: boolean;
}
