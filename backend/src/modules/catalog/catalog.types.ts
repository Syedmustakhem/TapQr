export type CatalogType =
  | "MENU"
  | "PRODUCTS"
  | "SERVICES"
  | "GENERAL";

export interface CreateCatalogDTO {
  businessId: string;
  ownerId: string;
  name: string;
  description?: string;
  type: CatalogType;
}

export interface UpdateCatalogDTO {
  id: string;
  ownerId: string;
  name?: string;
  description?: string;
  type?: CatalogType;
  isActive?: boolean;
  sortOrder?: number;
}