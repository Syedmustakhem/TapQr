export interface CreateCatalogItemDTO {
  categoryId: string;

  name: string;

  description?: string;

  type: string;

  price?: number;

  compareAtPrice?: number;

  currency?: string;

  image?: string;

  gallery?: unknown;

  sku?: string;

  unit?: string;

  stock?: number;

  durationMinutes?: number;

  isAvailable?: boolean;

  isFeatured?: boolean;

  sortOrder?: number;

  metadata?: unknown;
}

export interface UpdateCatalogItemDTO {
  id: string;

  name?: string;

  description?: string;

  type?: string;

  price?: number;

  compareAtPrice?: number;

  currency?: string;

  image?: string;

  gallery?: unknown;

  sku?: string;

  unit?: string;

  stock?: number;

  durationMinutes?: number;

  isAvailable?: boolean;

  isFeatured?: boolean;

  sortOrder?: number;

  metadata?: unknown;
}