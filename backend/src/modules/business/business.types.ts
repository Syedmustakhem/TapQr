import { Request } from "express";

export interface BusinessAuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export interface CreateBusinessDTO {
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  logo?: string;
}

export interface UpdateBusinessDTO {
  name?: string;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  logo?: string | null;
}

export interface UpdateBusinessProfileDTO {
  tagline?: string | null;
  description?: string | null;

  website?: string | null;

  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;

  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  openingHours?: unknown;
  socialLinks?: unknown;

  coverImage?: string | null;
}