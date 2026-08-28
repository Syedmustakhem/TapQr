import { Response } from "express";

import { AuthRequest } from "../auth/auth.types";

import { ResponseHandler } from "../../cores/responses/ResponseHandler";

import {
  OptionGroupService,
} from "./option-group.service";

export class OptionGroupController {
  private service =
    new OptionGroupService();

  createOptionGroup = async (
    req: AuthRequest,
    res: Response
  ) => {
    const result =
      await this.service.createOptionGroup(
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
      "Option group created successfully.",
      result
    );
  };

  getItemOptionGroups = async (
    req: AuthRequest,
    res: Response
  ) => {
    const itemId =
      String(req.params.itemId);

    const result =
      await this.service.getItemOptionGroups(
        itemId,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Option groups retrieved successfully.",
      result
    );
  };

  getOptionGroup = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.getOptionGroup(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Option group retrieved successfully.",
      result
    );
  };

  updateOptionGroup = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.updateOptionGroup(
        {
          id,
          ...req.body,
        },
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Option group updated successfully.",
      result
    );
  };

  deleteOptionGroup = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.deleteOptionGroup(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      result.message
    );
  };
}