export interface CreateVariantDTO {
  itemId: string;

  name: string;

  price?: number;

  compareAtPrice?: number;

  sku?: string;

  stock?: number;

  isAvailable?: boolean;

  sortOrder?: number;
}

export interface UpdateVariantDTO {
  id: string;

  name?: string;

  price?: number;

  compareAtPrice?: number;

  sku?: string;

  stock?: number;

  isAvailable?: boolean;

  sortOrder?: number;
}