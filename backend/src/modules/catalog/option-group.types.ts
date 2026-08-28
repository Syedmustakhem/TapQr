export interface CreateOptionGroupDTO {
  itemId: string;

  name: string;

  required?: boolean;

  minSelect?: number;

  maxSelect?: number;

  sortOrder?: number;
}

export interface UpdateOptionGroupDTO {
  id: string;

  name?: string;

  required?: boolean;

  minSelect?: number;

  maxSelect?: number;

  sortOrder?: number;
}