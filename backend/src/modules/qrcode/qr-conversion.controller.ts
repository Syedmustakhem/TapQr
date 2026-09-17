import { NextFunction, Request, Response } from "express";
import { ResponseHandler } from "../../cores/responses/ResponseHandler";
import { QRConversionService } from "./qr-conversion.service";

const service = new QRConversionService();

export class QRConversionController {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const shortCode = String(
        req.params.shortCode ?? ""
      );

      const body = (req.body ?? {}) as Record<
        string,
        unknown
      >;

      const visitorKey =
        req.header("x-tapqr-visitor-key")?.trim() ||
        undefined;

      const result =
        await service.createPublicConversion({
          shortCode,

          conversionType: String(
            body.conversionType ?? ""
          ),

          externalId:
            typeof body.externalId === "string"
              ? body.externalId
              : undefined,

          value:
            typeof body.value === "number" ||
            typeof body.value === "string"
              ? body.value
              : undefined,

          currency:
            typeof body.currency === "string"
              ? body.currency
              : undefined,

          visitorKey,

          metadata:
            body.metadata &&
            typeof body.metadata === "object"
              ? (body.metadata as Record<
                  string,
                  unknown
                >)
              : undefined,
        });

      return ResponseHandler.success(
        res,
        result.duplicate
          ? "Conversion already recorded."
          : "Conversion recorded successfully.",
        result
      );
    } catch (error) {
      return next(error);
    }
  }
}

export const qrConversionController =
  new QRConversionController();