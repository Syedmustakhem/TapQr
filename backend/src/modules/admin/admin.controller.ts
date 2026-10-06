import {
  Response,
  NextFunction,
} from "express";
import { AuthRequest } from "../auth/auth.types";
import * as service from "./admin.service";

/*
 * ============================================================
 * ADMIN CONTROLLER — every route behind requireSuperAdmin
 * ============================================================
 */

type AdminIdentity = {
  id: string;
  email: string;
};

function identity(
  req: AuthRequest
): AdminIdentity {
  return {
    id: req.user!.id,
    email:
      (req.user as any)?.email ?? "",
  };
}

function ok(
  res: Response,
  data: unknown,
  status = 200
) {
  res.status(status).json({
    success: true,
    data,
  });
}

export class AdminController {
  /* OVERVIEW */
  getOverview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.getOverview()
      );
    } catch (e) {
      next(e);
    }
  };

  /* USERS */
  listUsers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listUsers(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  getUserDetail = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = param(req, "id");
      ok(
        res,
        await service.getUserDetail(id)
      );
    } catch (e) {
      next(e);
    }
  };

  suspendUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = param(req, "id");
      ok(
        res,
        await service.suspendUser(
          identity(req),
          id,
          (req.body as any)?.reason
        )
      );
    } catch (e) {
      next(e);
    }
  };

  unsuspendUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = param(req, "id");
      ok(
        res,
        await service.unsuspendUser(
          identity(req),
          id
        )
      );
    } catch (e) {
      next(e);
    }
  };

  grantPro = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = param(req, "id");
      const body = req.body as {
        days: number;
        reason?: string;
      };
      ok(
        res,
        await service.grantPro(
          identity(req),
          id,
          body.days,
          body.reason
        )
      );
    } catch (e) {
      next(e);
    }
  };

  extendTrial = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = param(req, "id");
      const body = req.body as {
        days: number;
        reason?: string;
      };
      ok(
        res,
        await service.extendTrial(
          identity(req),
          id,
          body.days,
          body.reason
        )
      );
    } catch (e) {
      next(e);
    }
  };

  /* BUSINESSES */
  listBusinesses = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listBusinesses(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  /* MONEY */
  listSubscriptions = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listSubscriptions(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  listPayments = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listPayments(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  /* TRIALS & REFERRALS */
  listTrials = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listTrials(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  listReferrals = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listReferrals(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  fraudSignals = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.fraudSignals()
      );
    } catch (e) {
      next(e);
    }
  };

  /* MODERATION */
  listReviewReports = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listReviewReports(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  resolveReport = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reportId = param(
        req,
        "reportId"
      );
      const body = req.body as {
        action: "dismiss" | "remove_review";
      };
      ok(
        res,
        await service.resolveReport(
          identity(req),
          reportId,
          body.action
        )
      );
    } catch (e) {
      next(e);
    }
  };

  /* PLANS & FLAGS */
  listPlans = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listPlans()
      );
    } catch (e) {
      next(e);
    }
  };

  updatePlan = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const code = param(req, "code");
      ok(
        res,
        await service.updatePlan(
          identity(req),
          code,
          req.body as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  listFlags = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listFlags()
      );
    } catch (e) {
      next(e);
    }
  };

  upsertFlag = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = req.body as {
        key: string;
        enabled: boolean;
        description?: string;
      };
      ok(
        res,
        await service.upsertFlag(
          identity(req),
          body.key,
          body.enabled,
          body.description
        )
      );
    } catch (e) {
      next(e);
    }
  };

  /* SUPPORT */
  listTickets = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listTickets(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  getTicket = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ticketId = param(
        req,
        "ticketId"
      );
      ok(
        res,
        await service.getTicket(ticketId)
      );
    } catch (e) {
      next(e);
    }
  };

  replyTicket = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ticketId = param(
        req,
        "ticketId"
      );
      const body = req.body as {
        reply: string;
        close?: boolean;
      };
      ok(
        res,
        await service.replyTicket(
          identity(req),
          ticketId,
          body.reply,
          body.close
        )
      );
    } catch (e) {
      next(e);
    }
  };

  /** User-facing: open a ticket (auth, not admin). */
  createTicket = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = req.body as {
        subject: string;
        message: string;
      };
      ok(
        res,
        await service.createTicket(
          req.user!.id,
          body.subject,
          body.message
        ),
        201
      );
    } catch (e) {
      next(e);
    }
  };

  /* BROADCAST */
  broadcast = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.broadcast(
          identity(req),
          req.body as never
        )
      );
    } catch (e) {
      next(e);
    }
  };

  /* AUDIT */
  listAuditLog = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      ok(
        res,
        await service.listAuditLog(
          req.query as never
        )
      );
    } catch (e) {
      next(e);
    }
  };
}

function param(
  req: AuthRequest,
  name: string
): string {
  const raw = (req.params as any)[name];
  return (
    Array.isArray(raw) ? raw[0] : raw
  ) ?? "";
}
