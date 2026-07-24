import { Response } from "express";

import { AuthRequest } from "../auth/auth.types";
import { ResponseHandler } from "../../cores/responses/ResponseHandler";
import { BusinessService } from "./business.service";

export class BusinessController {
  private businessService = new BusinessService();
getMyBusiness = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const result =
      await this.businessService.getMyBusiness(
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Business Retrieved Successfully",
      result
    );

  } catch (error: any) {

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });

  }

};
deleteBusiness = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result =
      await this.businessService.deleteBusiness(
        req.user!.id
      );

    return ResponseHandler.success(
      res,
      "Business Deleted Successfully",
      result
    );
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};
  createBusiness = async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const result = await this.businessService.createBusiness({
        ownerId: req.user!.id,
        ...req.body,
      });

      return ResponseHandler.created(
        res,
        "Business Created Successfully",
        result
      );
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
}