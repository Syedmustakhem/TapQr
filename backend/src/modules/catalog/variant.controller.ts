import {
  Response,
} from "express";

import {
  AuthRequest,
} from "../auth/auth.types";

import {
  ResponseHandler,
} from "../../cores/responses/ResponseHandler";

import {
  VariantService,
} from "./variant.service";

export class VariantController {
  private service =
    new VariantService();

  createVariant = async (
    req: AuthRequest,
    res: Response
  ) => {
    const result =
      await this.service.createVariant(
        {
          ...req.body,

          itemId:
            String(
              req.params.itemId
            ),
        },
        req.user!.id
      );

    return ResponseHandler.created(
      res,
      "Variant created successfully.",
      result
    );
  };

  getItemVariants = async (
    req: AuthRequest,
    res: Response
  ) => {
    const itemId =
      String(req.params.itemId);

    const result =
      await this.service.getItemVariants(
        itemId,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Variants retrieved successfully.",
      result
    );
  };

  getVariant = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.getVariant(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Variant retrieved successfully.",
      result
    );
  };

  updateVariant = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.updateVariant(
        {
          id,
          ...req.body,
        },
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Variant updated successfully.",
      result
    );
  };

  deleteVariant = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.deleteVariant(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      result.message
    );
  };
}