export interface CreateOptionDTO {
  groupId: string;

  name: string;

  price?: number;

  isAvailable?: boolean;

  sortOrder?: number;
}

export interface UpdateOptionDTO {
  id: string;

  name?: string;

  price?: number;

  isAvailable?: boolean;

  sortOrder?: number;
}