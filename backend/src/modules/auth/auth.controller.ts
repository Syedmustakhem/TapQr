import { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { AuthRequest } from "./auth.types";

import { ResponseHandler } from "../../cores/responses/ResponseHandler";

export class AuthController {
  private authService = new AuthService();

  /*
  |--------------------------------------------------------------------------
  | PASSWORD REGISTER
  |--------------------------------------------------------------------------
  */

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);

      return ResponseHandler.created(
        res,
        "User Registered Successfully",
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PASSWORD LOGIN
  |--------------------------------------------------------------------------
  */

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);

      return ResponseHandler.success(
        res,
        "Login Successful",
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CURRENT USER
  |--------------------------------------------------------------------------
  */

  me = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "UNAUTHORIZED",
        });
      }

      const result = await this.authService.me(
        req.user.id
      );

      return ResponseHandler.success(
        res,
        "User Retrieved Successfully",
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  logout = async (_req: Request, res: Response) => {
    try {
      const result = await this.authService.logout();

      return ResponseHandler.success(
        res,
        "Logout Successful",
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH TOKEN
  |--------------------------------------------------------------------------
  */

  refresh = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.refresh(
        req.body.refreshToken
      );

      return ResponseHandler.success(
        res,
        "Access Token Refreshed Successfully",
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EMAIL OTP - SEND
  |--------------------------------------------------------------------------
  |
  | REGISTER:
  | {
  |   email: "...",
  |   mode: "register"
  | }
  |
  | LOGIN:
  | {
  |   email: "...",
  |   mode: "login"
  | }
  |
  */

  sendEmailOtp = async (req: Request, res: Response) => {
    try {
      const result =
        await this.authService.sendEmailOtp(
          req.body.email,
          req.body.mode
        );

      return ResponseHandler.success(
        res,
        result.message,
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EMAIL OTP - VERIFY
  |--------------------------------------------------------------------------
  |
  | REGISTER:
  | {
  |   email: "...",
  |   otp: "123456",
  |   mode: "register",
  |   fullName: "..."
  | }
  |
  | LOGIN:
  | {
  |   email: "...",
  |   otp: "123456",
  |   mode: "login"
  | }
  |
  */

  verifyEmailOtp = async (req: Request, res: Response) => {
    try {
      const result =
        await this.authService.verifyEmailOtp(
          req.body.email,
          req.body.otp,
          req.body.mode,
          req.body.fullName
        );

      return ResponseHandler.success(
        res,
        "Authentication Successful",
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP OTP - SEND
  |--------------------------------------------------------------------------
  */

  sendWhatsappOtp = async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        await this.authService.sendWhatsappOtp(
          req.body.phone,
          req.body.mode
        );

      return ResponseHandler.success(
        res,
        result.message,
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP OTP - VERIFY
  |--------------------------------------------------------------------------
  */

  verifyWhatsappOtp = async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        await this.authService.verifyWhatsappOtp(
          req.body.phone,
          req.body.otp,
          req.body.mode,
          req.body.fullName
        );

      return ResponseHandler.success(
        res,
        "Authentication Successful",
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | GOOGLE AUTHENTICATION
  |--------------------------------------------------------------------------
  |
  | REGISTER:
  | {
  |   idToken: "...",
  |   mode: "register"
  | }
  |
  | LOGIN:
  | {
  |   idToken: "...",
  |   mode: "login"
  | }
  |
  */

  googleLogin = async (
    req: Request,
    res: Response
  ) => {
    try {
      const result =
        await this.authService.loginWithGoogle(
          req.body.idToken,
          req.body.mode
        );

      return ResponseHandler.success(
        res,
        "Authentication Successful",
        result
      );
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
        code: error.code || "INTERNAL_ERROR",
      });
    }
  };
}