import { Request, Response, NextFunction } from "express";
import { QRCodePublicService } from "./qrcode.public.service";
import { resolveGeoLocation } from "../../utils/geoip";

export class QRCodeRedirectController {

  private readonly service = new QRCodePublicService();

  redirect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shortCode = String(req.params.shortCode ?? "").trim();
      const qr = await this.service.getRedirectTarget(shortCode, req);

      const forwardedFor = req.headers["x-forwarded-for"];
      const ipAddress = typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]?.trim() || req.ip || undefined
        : req.ip || undefined;

      const geo = await resolveGeoLocation(
  req.headers as Record<string, unknown>,
  ipAddress
);

await this.service.recordScan(shortCode, {
  ipAddress,
  country: geo.country,
  city: geo.city,
  userAgent: req.get("user-agent") || undefined,

        referrer: req.get("referer") || undefined,
        browser: req.get("sec-ch-ua") || undefined,
        device: req.get("sec-ch-ua-mobile") || undefined,
        operatingSystem: req.get("sec-ch-ua-platform") || undefined,
      });

      res.redirect(302, qr.destinationUrl!);
    } catch (error) {
      next(error);
    }
  };
}
