import { Request } from "express";

export interface BusinessAuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Business creation
 */
export interface CreateBusinessDTO {
  name: string;

  legalName?: string;
  displayName?: string;

  businessType?: string;
  industry?: string;
  category?: string;
  subcategory?: string;

  email?: string;
  phone?: string;
  website?: string;
  whatsapp?: string;

  logo?: string;
  coverImage?: string;

  description?: string;

  timezone?: string;
  currency?: string;
  language?: string;
  country?: string;
}

/**
 * Business core update
 */
export interface UpdateBusinessDTO {
  name?: string | null;

  legalName?: string | null;
  displayName?: string | null;

  businessType?: string | null;
  industry?: string | null;
  category?: string | null;
  subcategory?: string | null;

  email?: string | null;
  phone?: string | null;
  website?: string | null;
  whatsapp?: string | null;

  logo?: string | null;
  coverImage?: string | null;

  description?: string | null;

  timezone?: string | null;
  currency?: string | null;
  language?: string | null;
  country?: string | null;

  isVerified?: boolean;
  isPublished?: boolean;
  onboardingCompleted?: boolean;
}

/**
 * Business profile update
 */
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