import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AuthRequest } from "./auth.types";
import { ResponseHandler } from "../../cores/responses/ResponseHandler";

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      return ResponseHandler.created(res, "User Registered Successfully", result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);
      return ResponseHandler.success(res, "Login Successful", result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  me = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.authService.me(req.user!.id);
      return ResponseHandler.success(res, "User Retrieved Successfully", result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.logout();
      return ResponseHandler.success(res, "Logout Successful", result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.refresh(req.body.refreshToken);
      return ResponseHandler.success(res, "Access Token Refreshed Successfully", result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  sendEmailOtp = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.sendEmailOtp(req.body.email);
      return ResponseHandler.success(res, result.message, result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  verifyEmailOtp = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.verifyEmailOtp(
        req.body.email,
        req.body.otp,
        req.body.fullName
      );
      return ResponseHandler.success(res, "Login Successful", result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  sendWhatsappOtp = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.sendWhatsappOtp(req.body.phone);
      return ResponseHandler.success(res, result.message, result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  verifyWhatsappOtp = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.verifyWhatsappOtp(
        req.body.phone,
        req.body.otp,
        req.body.fullName
      );
      return ResponseHandler.success(res, "Login Successful", result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  googleLogin = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.loginWithGoogle(req.body.idToken);
      return ResponseHandler.success(res, "Login Successful", result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || "Internal Server Error",
  code: error.code || "INTERNAL_ERROR",
});
    }
  };
}