import {
  Response,
  NextFunction,
} from "express";

import { StaffService } from "../services/staff.service";
import { AuthRequest } from "../../auth/auth.types";

export class StaffController {
  private staffService = new StaffService();

  /**
   * POST /staff/invitations
   */
  async inviteStaff(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ownerId = req.user?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const result =
        await this.staffService.inviteStaff({
          ownerId,
          email: req.body.email,
          role: req.body.role,
        });

      return res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /staff/invitations/:token/accept
   */
  async acceptInvitation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const token = String(req.params.token);

      const result =
        await this.staffService.acceptInvitation({
          userId,
          token,
        });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /staff/members
   */
  async getMembers(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ownerId = req.user?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const members =
        await this.staffService.getMembers(
          ownerId
        );

      return res.status(200).json({
        success: true,
        members,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /staff/members/:memberId
   */
  async updateMemberRole(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ownerId = req.user?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const memberId =
        String(req.params.memberId);

      const member =
        await this.staffService.updateMemberRole(
          ownerId,
          memberId,
          req.body.role
        );

      return res.status(200).json({
        success: true,
        message:
          "Member updated successfully.",
        member,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /staff/members/:memberId
   */
  async removeMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ownerId = req.user?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
          code: "UNAUTHORIZED",
        });
      }

      const memberId =
        String(req.params.memberId);

      const result =
        await this.staffService.removeMember(
          ownerId,
          memberId
        );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}