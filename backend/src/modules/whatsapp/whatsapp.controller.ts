import { Request, Response, NextFunction } from "express";
import { ConversationStatus } from "@prisma/client";
import { conversationService } from "./conversations/conversation.service";
import { messageService } from "./messages/message.service";

export class WhatsAppController {
  getConversations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const businessId = (req as any).user?.businessId;

      if (!businessId) {
        res.status(401).json({
          success: false,
          message: "Business authentication required",
        });
        return;
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const status = req.query.status
        ? (String(req.query.status) as ConversationStatus)
        : undefined;

      const result = await conversationService.getConversations(
        businessId,
        {
          page,
          limit,
          status,
        },
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const businessId = (req as any).user?.businessId;

      if (!businessId) {
        res.status(401).json({
          success: false,
          message: "Business authentication required",
        });
        return;
      }

      const conversationId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const conversation =
        await conversationService.getConversation(
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
  sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const businessId = (req as any).user?.businessId;

      if (!businessId) {
        res.status(401).json({
          success: false,
          message: "Business authentication required",
        });
        return;
      }

      const conversationId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const { text } = req.body;

      if (typeof text !== "string" || !text.trim()) {
        res.status(400).json({
          success: false,
          message: "Message text is required",
        });
        return;
      }

      const message = await messageService.sendTextMessage(
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
  getMessages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const businessId = (req as any).user?.businessId;

      if (!businessId) {
        res.status(401).json({
          success: false,
          message: "Business authentication required",
        });
        return;
      }

      const conversationId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;

      const result = await messageService.getMessages(
        businessId,
        conversationId,
        {
          page,
          limit,
        },
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateConversationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const businessId = (req as any).user?.businessId;

      if (!businessId) {
        res.status(401).json({
          success: false,
          message: "Business authentication required",
        });
        return;
      }

      const conversationId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const { status } = req.body;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          message: "Conversation status is required",
        });
        return;
      }

      const validStatuses = Object.values(ConversationStatus);

      if (!validStatuses.includes(status as ConversationStatus)) {
        res.status(400).json({
          success: false,
          message: "Invalid conversation status",
          validStatuses,
        });
        return;
      }

      const result =
        await conversationService.updateConversationStatus(
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
    assignConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const businessId = (req as any).user?.businessId;

      if (!businessId) {
        res.status(401).json({
          success: false,
          message: "Business authentication required",
        });
        return;
      }

      const conversationId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

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

      const conversation =
        await conversationService.assignConversation(
          businessId,
          conversationId,
          businessMemberId,
        );

      res.status(200).json({
        success: true,
        message: "Conversation assigned successfully",
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  unassignConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const businessId = (req as any).user?.businessId;

      if (!businessId) {
        res.status(401).json({
          success: false,
          message: "Business authentication required",
        });
        return;
      }

      const conversationId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const conversation =
        await conversationService.unassignConversation(
          businessId,
          conversationId,
        );

      res.status(200).json({
        success: true,
        message: "Conversation unassigned successfully",
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  setHandlingMode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const businessId = (req as any).user?.businessId;

    if (!businessId) {
      res.status(401).json({
        success: false,
        message: "Business authentication required",
      });
      return;
    }

    const conversationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

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
      await conversationService.setHandlingMode(
        businessId,
        conversationId,
        handlingMode,
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

export const whatsappController = new WhatsAppController();