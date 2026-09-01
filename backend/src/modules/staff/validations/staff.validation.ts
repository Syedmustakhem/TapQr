import { z } from "zod";
import {
  BusinessMemberRole,
  BusinessMemberStatus,
  InvitationStatus,
} from "@prisma/client";

/*
|--------------------------------------------------------------------------
| Invitation
|--------------------------------------------------------------------------
*/

export const inviteStaffSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email address."),

    role: z.enum([
      BusinessMemberRole.MANAGER,
      BusinessMemberRole.STAFF,
    ]),
  })
  .strict();

export const invitationTokenSchema = z
  .string()
  .trim()
  .regex(
    /^[a-f0-9]{64}$/i,
    "Invalid invitation token."
  );

export const acceptInvitationSchema = z
  .object({
    token: invitationTokenSchema,
  })
  .strict();

/*
|--------------------------------------------------------------------------
| Member management
|--------------------------------------------------------------------------
*/

export const updateMemberRoleSchema = z
  .object({
    role: z.enum([
      BusinessMemberRole.MANAGER,
      BusinessMemberRole.STAFF,
    ]),
  })
  .strict();

export const updateMemberStatusSchema = z
  .object({
    status: z.enum([
      BusinessMemberStatus.ACTIVE,
      BusinessMemberStatus.SUSPENDED,
    ]),
  })
  .strict();

export const removeMemberSchema = z
  .object({})
  .strict();

/*
|--------------------------------------------------------------------------
| Query parameters
|--------------------------------------------------------------------------
*/

export const staffListQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(100000)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),

    search: z
      .string()
      .trim()
      .max(100)
      .optional(),

    role: z
      .enum([
        BusinessMemberRole.OWNER,
        BusinessMemberRole.MANAGER,
        BusinessMemberRole.STAFF,
      ])
      .optional(),

    status: z
      .enum([
        BusinessMemberStatus.ACTIVE,
        BusinessMemberStatus.SUSPENDED,
        BusinessMemberStatus.REMOVED,
      ])
      .optional(),
  })
  .strict();

export const invitationListQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(100000)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25),

    status: z
      .enum([
        InvitationStatus.PENDING,
        InvitationStatus.ACCEPTED,
        InvitationStatus.REJECTED,
        InvitationStatus.EXPIRED,
      ])
      .optional(),
  })
  .strict();
