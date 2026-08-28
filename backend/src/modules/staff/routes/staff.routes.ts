import { Router } from "express";

import {
  StaffController,
} from "../controllers/staff.controller";

import { authenticate } from "../../auth/auth.middleware";

import {
  validate,
} from "../../../cores/middleware/validate";

import {
  inviteStaffSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
} from "../validations/staff.validation";

const router =
  Router();

const staffController =
  new StaffController();

/**
 * Invite Staff
 *
 * POST /staff/invitations
 */
router.post(
  "/invitations",
  authenticate,
  validate(inviteStaffSchema),
  staffController.inviteStaff.bind(
    staffController
  )
);

/**
 * Accept Invitation
 *
 * POST /staff/invitations/:token/accept
 */
router.post(
  "/invitations/:token/accept",
  authenticate,
  staffController.acceptInvitation.bind(
    staffController
  )
);

/**
 * Get Business Members
 *
 * GET /staff/members
 */
router.get(
  "/members",
  authenticate,
  staffController.getMembers.bind(
    staffController
  )
);

/**
 * Update Member Role
 *
 * PATCH /staff/members/:memberId
 */
router.patch(
  "/members/:memberId",
  authenticate,
  validate(updateMemberRoleSchema),
  staffController.updateMemberRole.bind(
    staffController
  )
);

/**
 * Remove Member
 *
 * DELETE /staff/members/:memberId
 */
router.delete(
  "/members/:memberId",
  authenticate,
  validate(removeMemberSchema),
  staffController.removeMember.bind(
    staffController
  )
);

export default router;