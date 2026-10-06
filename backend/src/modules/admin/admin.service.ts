import { AppError } from "../../cores/errors/AppError";
import { AdminRepository } from "./admin.repository";
import { sendNotificationWhatsApp } from "../notifications/providers/whatsapp.provider";
import { sendNotificationEmail } from "../notifications/providers/email.provider";
import type { AdminListQuery } from "./admin.validation";

/*
 * ============================================================
 * ADMIN SERVICE — super admin operations
 * ============================================================
 *
 * Every mutating action writes an AdminAuditLog row.
 */

const repository = new AdminRepository();

type AdminIdentity = {
  id: string;
  email: string;
};

async function audit(
  admin: AdminIdentity,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: object
) {
  await repository.logAction({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action,
    targetType,
    targetId,
    details,
  });
}

/* ---------------- OVERVIEW ---------------- */

export async function getOverview() {
  const [counts, signups, revenue] =
    await Promise.all([
      repository.overviewCounts(),
      repository.signupsLast30Days(),
      repository.revenueByMonth(),
    ]);

  return { ...counts, signups, revenue };
}

/* ---------------- USERS ---------------- */

export async function listUsers(
  query: AdminListQuery
) {
  return repository.listUsers(query);
}

export async function getUserDetail(
  userId: string
) {
  const user =
    await repository.getUserDetail(
      userId
    );

  if (!user) {
    throw new AppError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return user;
}

export async function suspendUser(
  admin: AdminIdentity,
  userId: string,
  reason?: string
) {
  if (userId === admin.id) {
    throw new AppError(
      "You cannot suspend your own account.",
      400,
      "CANNOT_SUSPEND_SELF"
    );
  }

  const result =
    await repository.setUserActive(
      userId,
      false
    );

  await audit(
    admin,
    "USER_SUSPEND",
    "User",
    userId,
    { reason }
  );

  return result;
}

export async function unsuspendUser(
  admin: AdminIdentity,
  userId: string
) {
  const result =
    await repository.setUserActive(
      userId,
      true
    );

  await audit(
    admin,
    "USER_UNSUSPEND",
    "User",
    userId
  );

  return result;
}

export async function grantPro(
  admin: AdminIdentity,
  userId: string,
  days: number,
  reason?: string
) {
  const result =
    await repository.grantPro(
      userId,
      days,
      "ADMIN_GRANT"
    );

  if (!result) {
    throw new AppError(
      "User not found.",
      404,
      "USER_NOT_FOUND"
    );
  }

  await audit(
    admin,
    "PRO_GRANT",
    "User",
    userId,
    { days, reason }
  );

  return result;
}

export async function extendTrial(
  admin: AdminIdentity,
  userId: string,
  days: number,
  reason?: string
) {
  const result =
    await repository.extendTrial(
      userId,
      days
    );

  if (!result) {
    throw new AppError(
      "No trial found for this user.",
      404,
      "TRIAL_NOT_FOUND"
    );
  }

  await audit(
    admin,
    "TRIAL_EXTEND",
    "User",
    userId,
    { days, reason }
  );

  return result;
}

/* ---------------- BUSINESSES ---------------- */

export async function listBusinesses(
  query: AdminListQuery
) {
  return repository.listBusinesses(query);
}

/* ---------------- MONEY ---------------- */

export async function listSubscriptions(
  query: AdminListQuery
) {
  return repository.listSubscriptions(
    query
  );
}

export async function listPayments(
  query: AdminListQuery
) {
  return repository.listPayments(query);
}

/* ---------------- TRIALS & REFERRALS ---------------- */

export async function listTrials(
  query: AdminListQuery
) {
  return repository.listTrials(query);
}

export async function listReferrals(
  query: AdminListQuery
) {
  return repository.listReferrals(query);
}

export async function fraudSignals() {
  return repository.duplicatePhoneTrials();
}

/* ---------------- MODERATION ---------------- */

export async function listReviewReports(
  query: AdminListQuery
) {
  return repository.listReviewReports(
    query
  );
}

export async function resolveReport(
  admin: AdminIdentity,
  reportId: string,
  action: "dismiss" | "remove_review"
) {
  const result =
    await repository.resolveReport(
      reportId,
      action
    );

  if (!result) {
    throw new AppError(
      "Report not found.",
      404,
      "REPORT_NOT_FOUND"
    );
  }

  await audit(
    admin,
    action === "dismiss"
      ? "REPORT_DISMISS"
      : "REVIEW_REMOVE",
    "ReviewReport",
    reportId
  );

  return result;
}

/* ---------------- PLANS & FLAGS ---------------- */

export async function listPlans() {
  return repository.listPlans();
}

export async function updatePlan(
  admin: AdminIdentity,
  code: string,
  data: {
    name?: string;
    pricePaise?: number;
    maxQrs?: number;
    maxBusinesses?: number;
    maxSeats?: number;
    features?: string[];
    isActive?: boolean;
  }
) {
  const result =
    await repository.updatePlan(
      code,
      data
    );

  await audit(
    admin,
    "PLAN_UPDATE",
    "Plan",
    code,
    data
  );

  return result;
}

export async function listFlags() {
  return repository.listFlags();
}

export async function upsertFlag(
  admin: AdminIdentity,
  key: string,
  enabled: boolean,
  description?: string
) {
  const result =
    await repository.upsertFlag(
      key,
      enabled,
      description
    );

  await audit(
    admin,
    "FLAG_UPSERT",
    "FeatureFlag",
    key,
    { enabled }
  );

  return result;
}

/* ---------------- SUPPORT ---------------- */

export async function listTickets(
  query: AdminListQuery
) {
  return repository.listTickets(query);
}

export async function getTicket(
  ticketId: string
) {
  const ticket =
    await repository.getTicket(
      ticketId
    );

  if (!ticket) {
    throw new AppError(
      "Ticket not found.",
      404,
      "TICKET_NOT_FOUND"
    );
  }

  return ticket;
}

export async function replyTicket(
  admin: AdminIdentity,
  ticketId: string,
  reply: string,
  close?: boolean
) {
  const result =
    await repository.replyTicket(
      ticketId,
      reply,
      admin.id,
      close ?? false
    );

  await audit(
    admin,
    "TICKET_REPLY",
    "SupportTicket",
    ticketId,
    { close: close ?? false }
  );

  return result;
}

/** User-facing: open a support ticket. */
export async function createTicket(
  userId: string,
  subject: string,
  message: string
) {
  return repository.createTicket(
    userId,
    subject,
    message
  );
}

/* ---------------- BROADCASTS ---------------- */

export async function broadcast(
  admin: AdminIdentity,
  input: {
    channel: "whatsapp" | "email";
    segment: "all" | "pro" | "trial" | "free";
    message: string;
  }
) {
  let sent = 0;
  let failed = 0;

  if (
    input.channel === "whatsapp"
  ) {
    const phones =
      await repository.segmentPhones(
        input.segment
      );

    for (const phone of phones) {
      try {
        await sendNotificationWhatsApp(
          {
            toPhoneE164: phone,
            recipientName: "there",
            message: input.message,
          }
        );
        sent++;
      } catch {
        failed++;
      }
    }
  } else {
    const emails =
      await repository.segmentEmails(
        input.segment
      );

    for (const email of emails) {
      try {
        await sendNotificationEmail({
          to: email,
          subject:
            "A message from TapQR",
          text: input.message,
          html: `<p>${escapeHtml(
            input.message
          ).replace(/\n/g, "<br>")}</p>`,
        });
        sent++;
      } catch {
        failed++;
      }
    }
  }

  await audit(
    admin,
    "BROADCAST",
    "Broadcast",
    undefined,
    {
      channel: input.channel,
      segment: input.segment,
      sent,
      failed,
    }
  );

  return { sent, failed };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------------- AUDIT ---------------- */

export async function listAuditLog(
  query: AdminListQuery
) {
  return repository.listAuditLog(query);
}
