import { Router } from "express";

import {
  StaffController,
} from "../controllers/staff.controller";

import {
  authenticate,
} from "../../auth/auth.middleware";

import {
  validate,
} from "../../../cores/middleware/validate";

import {
  authLimiter,
} from "../../../cores/middleware/rateLimiter";

import {
  inviteStaffSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
  removeMemberSchema,
} from "../validations/staff.validation";

const router = Router();

const controller =
  new StaffController();

/*
|--------------------------------------------------------------------------
| All staff routes are authenticated.
|--------------------------------------------------------------------------
*/

router.use(
  authenticate
);

/*
|--------------------------------------------------------------------------
| Invitations
|--------------------------------------------------------------------------
*/

/*
 * POST /api/staff/businesses/:businessId/invitations
 */
router.post(
  "/businesses/:businessId/invitations",
  authLimiter,
  validate(inviteStaffSchema),
  controller.inviteStaff.bind(
    controller
  )
);

/*
 * GET /api/staff/businesses/:businessId/invitations
 */
router.get(
  "/businesses/:businessId/invitations",
  controller.listInvitations.bind(
    controller
  )
);

/*
 * POST /api/staff/businesses/:businessId/invitations/:invitationId/resend
 */
router.post(
  "/businesses/:businessId/invitations/:invitationId/resend",
  authLimiter,
  controller.resendInvitation.bind(
    controller
  )
);

/*
 * POST /api/staff/businesses/:businessId/invitations/:invitationId/cancel
 */
router.post(
  "/businesses/:businessId/invitations/:invitationId/cancel",
  controller.cancelInvitation.bind(
    controller
  )
);

/*
 * POST /api/staff/invitations/:token/accept
 */
router.post(
  "/invitations/:token/accept",
  controller.acceptInvitation.bind(
    controller
  )
);

/*
|--------------------------------------------------------------------------
| Members
|--------------------------------------------------------------------------
*/

/*
 * GET /api/staff/businesses/:businessId/members
 */
router.get(
  "/businesses/:businessId/members",
  controller.getMembers.bind(
    controller
  )
);

/*
 * PATCH /api/staff/businesses/:businessId/members/:memberId/role
 */
router.patch(
  "/businesses/:businessId/members/:memberId/role",
  validate(updateMemberRoleSchema),
  controller.updateMemberRole.bind(
    controller
  )
);

/*
 * PATCH /api/staff/businesses/:businessId/members/:memberId/status
 */
router.patch(
  "/businesses/:businessId/members/:memberId/status",
  validate(updateMemberStatusSchema),
  controller.updateMemberStatus.bind(
    controller
  )
);

/*
 * DELETE /api/staff/businesses/:businessId/members/:memberId
 */
router.delete(
  "/businesses/:businessId/members/:memberId",
  validate(removeMemberSchema),
  controller.removeMember.bind(
    controller
  )
);

export default router;
