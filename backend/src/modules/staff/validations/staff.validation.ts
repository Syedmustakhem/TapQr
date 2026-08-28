import { z } from "zod";

import {
  BusinessMemberRole,
} from "@prisma/client";

/**
 * Invite staff.
 */
export const inviteStaffSchema =
  z.object({
    email: z
      .string()
      .trim()
      .email(
        "Invalid email address."
      ),

    role: z.enum([
      BusinessMemberRole.MANAGER,
      BusinessMemberRole.STAFF,
    ]),
  });

/**
 * Accept invitation.
 *
 * The token is normally taken from the
 * URL parameter, but we keep this schema
 * compatible with the existing route
 * validation middleware.
 */
export const acceptInvitationSchema =
  z.object({
    token: z
      .string()
      .trim()
      .min(
        32,
        "Invalid invitation token."
      ),
  });

/**
 * Update member role.
 */
export const updateMemberRoleSchema =
  z.object({
    role: z.enum([
      BusinessMemberRole.MANAGER,
      BusinessMemberRole.STAFF,
    ]),
  });

/**
 * Remove member.
 */
export const removeMemberSchema =
  z.object({}).strict();