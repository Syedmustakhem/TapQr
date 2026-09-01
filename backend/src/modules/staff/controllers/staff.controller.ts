import {
  Response,
  NextFunction,
} from "express";

import { AuthRequest } from "../../auth/auth.types";

import {
  StaffService,
} from "../services/staff.service";

import {
  inviteStaffSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
  removeMemberSchema,
  staffListQuerySchema,
  invitationListQuerySchema,
} from "../validations/staff.validation";

import {
  ResponseHandler,
} from "../../../cores/responses/ResponseHandler";

export class StaffController {
  private readonly staffService =
    new StaffService();

  private getUserId(
    req: AuthRequest
  ) {
    if (!req.user?.id) {
      throw new Error(
        "Authentication required."
      );
    }

    return req.user.id;
  }

  async inviteStaff(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const actorId =
        this.getUserId(req);

      const input =
        inviteStaffSchema.parse(
          req.body
        );

      const businessId =
        String(
          req.params.businessId ?? ""
        ).trim();

      const result =
        await this.staffService.inviteStaff(
          {
            actorId,
            businessId,
            email: input.email,
            role: input.role,
          }
        );

      return ResponseHandler.created(
        res,
        result.message,
        result
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "Authentication required."
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      next(error);
    }
  }

  async listInvitations(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const actorId =
        this.getUserId(req);

      const query =
        invitationListQuerySchema.parse(
          req.query
        );

      const result =
        await this.staffService.listInvitations(
          actorId,
          String(
            req.params.businessId
          ),
          query
        );

      return ResponseHandler.success(
        res,
        "Invitations retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async resendInvitation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const actorId =
        this.getUserId(req);

      const result =
        await this.staffService.resendInvitation(
          {
            actorId,
            businessId: String(
              req.params.businessId
            ),
            invitationId:
              String(
                req.params.invitationId
              ),
          }
        );

      return ResponseHandler.success(
        res,
        result.message,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async cancelInvitation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const actorId =
        this.getUserId(req);

      const result =
        await this.staffService.cancelInvitation(
          {
            actorId,
            businessId: String(
              req.params.businessId
            ),
            invitationId:
              String(
                req.params.invitationId
              ),
          }
        );

      return ResponseHandler.success(
        res,
        result.message,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId =
        this.getUserId(req);

      const input =
        acceptInvitationSchema.parse(
          {
            token: String(
              req.params.token ??
                ""
            ),
          }
        );

      const result =
        await this.staffService.acceptInvitation(
          {
            userId,
            token: input.token,
          }
        );

      return ResponseHandler.success(
        res,
        result.message,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async getMembers(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const actorId =
        this.getUserId(req);

      const query =
        staffListQuerySchema.parse(
          req.query
        );

      const result =
        await this.staffService.getMembers(
          actorId,
          String(
            req.params.businessId
          ),
          query
        );

      return ResponseHandler.success(
        res,
        "Members retrieved successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const actorId =
        this.getUserId(req);

      const input =
        updateMemberRoleSchema.parse(
          req.body
        );

      const result =
        await this.staffService.updateMemberRole(
          {
            actorId,
            businessId: String(
              req.params.businessId
            ),
            memberId: String(
              req.params.memberId
            ),
            role: input.role,
          }
        );

      return ResponseHandler.success(
        res,
        "Member role updated successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async updateMemberStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const actorId =
        this.getUserId(req);

      const input =
        updateMemberStatusSchema.parse(
          req.body
        );

      const result =
        await this.staffService.updateMemberStatus(
          {
            actorId,
            businessId: String(
              req.params.businessId
            ),
            memberId: String(
              req.params.memberId
            ),
            status:
              input.status,
          }
        );

      return ResponseHandler.success(
        res,
        "Member access status updated successfully.",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async removeMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const actorId =
        this.getUserId(req);

      removeMemberSchema.parse(
        req.body
      );

      const result =
        await this.staffService.removeMember(
          {
            actorId,
            businessId: String(
              req.params.businessId
            ),
            memberId: String(
              req.params.memberId
            ),
          }
        );

      return ResponseHandler.success(
        res,
        result.message,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}
