/**
 * Business DTOs
 *
 * DTOs define the data contract between the API layer
 * and the business service layer.
 */

/**
 * Create a new business.
 *
 * ownerId is intentionally NOT included.
 * It must always come from the authenticated user.
 */
export interface CreateBusinessDTO {
  name: string;

  email?: string;

  phone?: string;

  description?: string;

  logo?: string;
}

/**
 * Update business information.
 *
 * Fields are optional because PATCH requests may update
 * only a subset of the business.
 */
export interface UpdateBusinessDTO {
  name?: string;

  email?: string | null;

  phone?: string | null;

  description?: string | null;

  logo?: string | null;
}

/**
 * Update the public-facing business profile.
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

/**
 * Business response returned by the API.
 *
 * Keep this separate from database models.
 * This allows us to change the Prisma schema later
 * without exposing the database structure directly.
 */
export interface BusinessSummaryDTO {
  id: string;

  name: string;

  slug: string;

  email: string | null;

  phone: string | null;

  logo: string | null;

  description: string | null;

  status: string;

  createdAt: Date;

  updatedAt: Date;
}