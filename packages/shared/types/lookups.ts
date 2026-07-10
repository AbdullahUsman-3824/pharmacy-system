export interface LookupInterface {
  name: string;
}
export enum LookupType {
  Company = "company",
  ProductType = "product-type",
  ProductGroup = "product-group",
  Generic = "generic",
}
export interface LookupEntity {
  id: string;
  name: string;
}
