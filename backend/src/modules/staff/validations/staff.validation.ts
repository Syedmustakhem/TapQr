import { z } from "zod";
import { BusinessMemberRole } from "@prisma/client";

/**
 * POST /staff/invitations
 */
export const inviteStaffSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email address"),

    role: z.nativeEnum(BusinessMemberRole),
  }),
});

/**
 * POST /staff/invitations/:token/accept
 */
export const acceptInvitationSchema = z.object({
  params: z.object({
    token: z
      .string()
      .min(1, "Invitation token is required"),
  }),
});

/**
 * PATCH /staff/members/:memberId
 */
export const updateMemberRoleSchema = z.object({
  params: z.object({
    memberId: z
      .string()
      .uuid("Invalid member id"),
  }),

  body: z.object({
    role: z.nativeEnum(BusinessMemberRole),
  }),
});

/**
 * DELETE /staff/members/:memberId
 */
export const removeMemberSchema = z.object({
  params: z.object({
    memberId: z
      .string()
      .uuid("Invalid member id"),
  }),
});

/**
 * GET /staff/members/:memberId (optional)
 */
export const memberIdSchema = z.object({
  params: z.object({
    memberId: z
      .string()
      .uuid("Invalid member id"),
  }),
});