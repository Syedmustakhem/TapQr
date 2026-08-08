export interface CreateQRCodeDTO {
  businessId: string;
  ownerId: string;
  name: string;
  description?: string;
  destinationUrl: string;
  type: "STATIC" | "DYNAMIC";
}
export interface UpdateQRCodeDTO {
  id: string;
  ownerId: string;
  name?: string;
  description?: string;
  destinationUrl?: string;
  status?: "ACTIVE" | "PAUSED" | "EXPIRED";
}