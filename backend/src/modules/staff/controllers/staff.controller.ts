import {
  Response,
  NextFunction,
} from "express";

import { AuthRequest } from "../../auth/auth.types";

import { StaffService } from "../services/staff.service";

export class StaffController {
  private staffService =
    new StaffService();

  /**
   * POST /staff/invitations
   */
  async inviteStaff(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result =
        await this.staffService.inviteStaff({
          ownerId: req.user!.id,
          email: req.body.email,
          role: req.body.role,
        });

      return res.status(201).json(
        result
      );
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
      const token = String(
        req.params.token
      );

      const result =
        await this.staffService.acceptInvitation(
          {
            userId: req.user!.id,
            token,
          }
        );

      return res.status(200).json(
        result
      );
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
      const members =
        await this.staffService.getMembers(
          req.user!.id
        );

      return res.status(200).json({
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
      const memberId = String(
        req.params.memberId
      );

      const member =
        await this.staffService.updateMemberRole(
          req.user!.id,
          memberId,
          req.body.role
        );

      return res.status(200).json({
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
      const memberId = String(
        req.params.memberId
      );

      const result =
        await this.staffService.removeMember(
          req.user!.id,
          memberId
        );

      return res.status(200).json(
        result
      );
    } catch (error) {
      next(error);
    }
  }
}