import { Request, Response, NextFunction } from "express";
import {
  ConversationHandlingMode,
  ConversationStatus,
} from "@prisma/client";

import { whatsappService } from "./whatsapp.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Get conversation ID safely from Express params.
 */
const getConversationId = (
  req: Request,
): string | undefined => {
  const value = req.params.id;

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

/**
 * Get business ID from X-Business-Id header.
 *
 * Business ID is intentionally NOT stored in the JWT.
 * The authenticated user ID comes from the JWT and the
 * WhatsApp service verifies access to this business.
 */
const getBusinessId = (
  req: Request,
): string | undefined => {
  const value = req.headers["x-business-id"];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export class WhatsAppController {
  /**
   * ---------------------------------------------------------
   * GET CONVERSATIONS
   * ---------------------------------------------------------
   * GET /api/whatsapp/conversations
   */
  getConversations = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const businessId = getBusinessId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: "X-Business-Id header is required",
        });
        return;
      }

      const status = req.query.status
        ? (String(req.query.status) as ConversationStatus)
        : undefined;

      if (
        status &&
        !Object.values(ConversationStatus).includes(status)
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid conversation status",
          validStatuses: Object.values(ConversationStatus),
        });
        return;
      }

      const conversations =
        await whatsappService.getConversations(
          userId,
          businessId,
          status,
        );

      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * ---------------------------------------------------------
   * GET SINGLE CONVERSATION
   * ---------------------------------------------------------
   * GET /api/whatsapp/conversations/:id
   */
  getConversation = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const businessId = getBusinessId(req);
      const conversationId = getConversationId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: "X-Business-Id header is required",
        });
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const conversation =
        await whatsappService.getConversation(
          userId,
          businessId,
          conversationId,
        );

      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * ---------------------------------------------------------
   * GET MESSAGES
   * ---------------------------------------------------------
   * GET /api/whatsapp/conversations/:id/messages
   */
  getMessages = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const businessId = getBusinessId(req);
      const conversationId = getConversationId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: "X-Business-Id header is required",
        });
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const messages =
        await whatsappService.getMessages(
          userId,
          businessId,
          conversationId,
        );

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * ---------------------------------------------------------
   * SEND MESSAGE
   * ---------------------------------------------------------
   * POST /api/whatsapp/conversations/:id/messages
   */
  sendMessage = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const businessId = getBusinessId(req);
      const conversationId = getConversationId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: "X-Business-Id header is required",
        });
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const { text } = req.body;

      if (
        typeof text !== "string" ||
        !text.trim()
      ) {
        res.status(400).json({
          success: false,
          message: "Message text is required",
        });
        return;
      }

      const message =
        await whatsappService.sendMessage(
          userId,
          businessId,
          conversationId,
          text,
        );

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * ---------------------------------------------------------
   * UPDATE CONVERSATION STATUS
   * ---------------------------------------------------------
   * PATCH /api/whatsapp/conversations/:id/status
   */
  updateConversationStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const businessId = getBusinessId(req);
      const conversationId = getConversationId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: "X-Business-Id header is required",
        });
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const { status } = req.body;

      if (
        typeof status !== "string" ||
        !Object.values(ConversationStatus).includes(
          status as ConversationStatus,
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid conversation status",
          validStatuses: Object.values(ConversationStatus),
        });
        return;
      }

      const result =
        await whatsappService.updateConversationStatus(
          userId,
          businessId,
          conversationId,
          status as ConversationStatus,
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * ---------------------------------------------------------
   * ASSIGN CONVERSATION
   * ---------------------------------------------------------
   * POST /api/whatsapp/conversations/:id/assign
   */
  assignConversation = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const businessId = getBusinessId(req);
      const conversationId = getConversationId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: "X-Business-Id header is required",
        });
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const { businessMemberId } = req.body;

      if (
        typeof businessMemberId !== "string" ||
        !businessMemberId.trim()
      ) {
        res.status(400).json({
          success: false,
          message: "Business member ID is required",
        });
        return;
      }

      const result =
        await whatsappService.assignConversation(
          userId,
          businessId,
          conversationId,
          businessMemberId,
        );

      res.status(200).json({
        success: true,
        message: "Conversation assigned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * ---------------------------------------------------------
   * UNASSIGN CONVERSATION
   * ---------------------------------------------------------
   * DELETE /api/whatsapp/conversations/:id/assign
   */
  unassignConversation = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const businessId = getBusinessId(req);
      const conversationId = getConversationId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: "X-Business-Id header is required",
        });
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const result =
        await whatsappService.unassignConversation(
          userId,
          businessId,
          conversationId,
        );

      res.status(200).json({
        success: true,
        message: "Conversation unassigned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * ---------------------------------------------------------
   * SET HANDLING MODE
   * ---------------------------------------------------------
   * PATCH /api/whatsapp/conversations/:id/handling-mode
   */
  setHandlingMode = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const businessId = getBusinessId(req);
      const conversationId = getConversationId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!businessId) {
        res.status(400).json({
          success: false,
          message: "X-Business-Id header is required",
        });
        return;
      }

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const { handlingMode } = req.body;

      if (
        handlingMode !== "AI" &&
        handlingMode !== "HUMAN"
      ) {
        res.status(400).json({
          success: false,
          message: "Handling mode must be AI or HUMAN",
        });
        return;
      }

      const result =
        await whatsappService.setHandlingMode(
          userId,
          businessId,
          conversationId,
          handlingMode as ConversationHandlingMode,
        );

      res.status(200).json({
        success: true,
        message: `Conversation handling mode changed to ${handlingMode}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const whatsappController =
  new WhatsAppController();