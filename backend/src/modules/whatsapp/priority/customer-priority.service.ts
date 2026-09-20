import { ConversationPriority } from "@prisma/client";

interface PriorityMessage {
  text: string | null;
}

interface PriorityInput {
  message: PriorityMessage;
  conversationMessageCount?: number;
  previousPriority?: ConversationPriority;
}

interface PriorityResult {
  priority: ConversationPriority;
  score: number;
  reasons: string[];
}

class CustomerPriorityService {
  evaluate(input: PriorityInput): PriorityResult {
    const {
      message,
      conversationMessageCount = 0,
      previousPriority,
    } = input;

    const text = (
      message.text ?? ""
    )
      .trim()
      .toLowerCase();

    let score = 0;

    const reasons: string[] = [];

    // =========================================================
    // URGENT LANGUAGE
    // =========================================================

    const urgentPatterns = [
      /\burgent\b/,
      /\bemergency\b/,
      /\basap\b/,
      /\bimmediately\b/,
      /\bcritical\b/,
      /\bhelp me now\b/,
      /\bplease help\b/,
    ];

    if (
      urgentPatterns.some((pattern) =>
        pattern.test(text),
      )
    ) {
      score += 50;

      reasons.push(
        "Customer used urgent language",
      );
    }

    // =========================================================
    // PAYMENT / MONEY PROBLEMS
    // =========================================================

    const paymentPatterns = [
      /\bpayment failed\b/,
      /\bpayment issue\b/,
      /\bpayment problem\b/,
      /\bpayment did not go through\b/,
      /\bmoney deducted\b/,
      /\bamount deducted\b/,
      /\bamount was deducted\b/,
      /\bcharged\b/,
      /\brefund\b/,
      /\brefund not received\b/,
      /\brefund pending\b/,
    ];

    if (
      paymentPatterns.some((pattern) =>
        pattern.test(text),
      )
    ) {
      score += 35;

      reasons.push(
        "Payment or financial issue detected",
      );
    }

    // =========================================================
    // ORDER PROBLEMS
    // =========================================================

    const orderIssuePatterns = [
      /\bwrong order\b/,
      /\border.*wrong\b/,
      /\bmissing order\b/,
      /\border.*missing\b/,
      /\border.*not received\b/,
      /\border.*never arrived\b/,
      /\bnever received\b/,
      /\border.*late\b/,
      /\blate order\b/,
      /\bdelayed order\b/,
      /\bincorrect order\b/,
      /\bwrong item\b/,
      /\bmissing item\b/,
    ];

    if (
      orderIssuePatterns.some((pattern) =>
        pattern.test(text),
      )
    ) {
      score += 30;

      reasons.push(
        "Order problem detected",
      );
    }

    // =========================================================
    // COMPLAINT / NEGATIVE SIGNALS
    // =========================================================

    const complaintPatterns = [
      /\bcomplaint\b/,
      /\bterrible\b/,
      /\bworst\b/,
      /\bdisappointed\b/,
      /\bnot happy\b/,
      /\bvery bad\b/,
      /\bpoor service\b/,
      /\bbad service\b/,
      /\bscam\b/,
      /\bfraud\b/,
      /\bcheated\b/,
      /\bangry\b/,
    ];

    if (
      complaintPatterns.some((pattern) =>
        pattern.test(text),
      )
    ) {
      score += 25;

      reasons.push(
        "Customer complaint detected",
      );
    }

    // =========================================================
    // HUMAN SUPPORT REQUEST
    // =========================================================

    const humanPatterns = [
      /\bhuman\b/,
      /\breal person\b/,
      /\bperson\b/,
      /\bagent\b/,
      /\bstaff\b/,
      /\brepresentative\b/,
      /\bcustomer service\b/,
      /\btalk to someone\b/,
      /\btalk to a person\b/,
      /\bspeak to someone\b/,
      /\bspeak to a person\b/,
      /\bconnect me\b/,
      /\btransfer me\b/,
    ];

    if (
      humanPatterns.some((pattern) =>
        pattern.test(text),
      )
    ) {
      score += 20;

      reasons.push(
        "Customer requested human support",
      );
    }

    // =========================================================
    // REPEATED CONTACT
    // =========================================================

    if (conversationMessageCount >= 6) {
      score += 15;

      reasons.push(
        "Customer has multiple messages in the conversation",
      );
    }

    if (conversationMessageCount >= 10) {
      score += 15;

      reasons.push(
        "Conversation has significant message volume",
      );
    }

    // =========================================================
    // PREVIOUS PRIORITY
    // =========================================================
    //
    // Existing priority acts as a floor.
    // We do NOT blindly add 100/40 points because that can
    // permanently inflate the calculated score.
    //
    // Example:
    // HIGH conversation + "thanks"
    // should remain at least HIGH,
    // but should not automatically become URGENT.
    // =========================================================

    let calculatedPriority =
      this.priorityFromScore(score);

    const previousRank =
      this.getPriorityRank(
        previousPriority,
      );

    const calculatedRank =
      this.getPriorityRank(
        calculatedPriority,
      );

    if (previousRank > calculatedRank) {
      calculatedPriority =
        previousPriority!;

      reasons.push(
        "Existing conversation priority was preserved",
      );
    }

    return {
      priority: calculatedPriority,
      score,
      reasons,
    };
  }

  private priorityFromScore(
    score: number,
  ): ConversationPriority {
    if (score >= 70) {
      return ConversationPriority.URGENT;
    }

    if (score >= 35) {
      return ConversationPriority.HIGH;
    }

    if (score >= 15) {
      return ConversationPriority.NORMAL;
    }

    return ConversationPriority.LOW;
  }

  private getPriorityRank(
    priority?: ConversationPriority,
  ): number {
    switch (priority) {
      case ConversationPriority.URGENT:
        return 4;

      case ConversationPriority.HIGH:
        return 3;

      case ConversationPriority.NORMAL:
        return 2;

      case ConversationPriority.LOW:
        return 1;

      default:
        return 0;
    }
  }
}

export const customerPriorityService =
  new CustomerPriorityService();