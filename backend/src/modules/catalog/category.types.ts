export interface CreateCategoryDTO {
  catalogId: string;
  ownerId: string;
  name: string;
  description?: string;
  image?: string;
}

export interface UpdateCategoryDTO {
  id: string;
  ownerId: string;
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}