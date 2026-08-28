import { Response } from "express";

import { AuthRequest } from "../auth/auth.types";

import { ResponseHandler } from "../../cores/responses/ResponseHandler";

import {
  OptionService,
} from "./option.service";

export class OptionController {
  private service =
    new OptionService();

  createOption = async (
    req: AuthRequest,
    res: Response
  ) => {
    const result =
      await this.service.createOption(
        {
          ...req.body,

          groupId:
            String(
              req.params.groupId
            ),
        },
        req.user!.id
      );

    return ResponseHandler.created(
      res,
      "Option created successfully.",
      result
    );
  };

  getGroupOptions = async (
    req: AuthRequest,
    res: Response
  ) => {
    const groupId =
      String(req.params.groupId);

    const result =
      await this.service.getGroupOptions(
        groupId,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Options retrieved successfully.",
      result
    );
  };

  getOption = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.getOption(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Option retrieved successfully.",
      result
    );
  };

  updateOption = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.updateOption(
        {
          id,
          ...req.body,
        },
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Option updated successfully.",
      result
    );
  };

  deleteOption = async (
    req: AuthRequest,
    res: Response
  ) => {
    const id =
      String(req.params.id);

    const result =
      await this.service.deleteOption(
        id,
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      result.message
    );
  };
}