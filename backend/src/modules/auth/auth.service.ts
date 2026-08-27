import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { AuthRepository } from "./auth.repository";
import { RegisterUserDTO, LoginUserDTO } from "./auth.types";

import { AppError } from "../../cores/errors/AppError";
import { env } from "../../config/env";
import { generateAccessToken, generateRefreshToken } from "./jwt";

import {
  generateOtp,
  hashOtp,
  compareOtp,
  normalizeEmail,
  normalizePhone,
} from "./otp.util";
import { sendOtpEmail } from "./email.provider";
import { sendOtpWhatsapp } from "./whatsapp.provider";
import { verifyGoogleIdToken } from "./google.provider";

const OTP_TTL_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

type OtpChannel = "EMAIL" | "WHATSAPP";

export class AuthService {
  private authRepository = new AuthRepository();

  async register(data: RegisterUserDTO) {
    const existingUser = await this.authRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.authRepository.registerUser({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
    });

    return {
      message: "User Registered Successfully",
      user,
    };
  }

  async login(data: LoginUserDTO) {
    const user = await this.authRepository.findUserByEmail(data.email);

    if (!user) {
      throw new AppError("Invalid Email or Password", 401);
    }

    const authProvider = await this.authRepository.findAuthProviderByUserId(
      user.id
    );

    if (!authProvider || !authProvider.passwordHash) {
      throw new AppError("Invalid Email or Password", 401);
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      authProvider.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid Email or Password", 401);
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    return {
      message: "Login Successful",
      accessToken,
      refreshToken,
      user,
    };
  }

  async logout() {
    return {
      success: true,
      message: "Logout successful",
    };
  }

  async me(userId: string) {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        id: string;
      };

      const user = await this.authRepository.findUserById(decoded.id);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return {
        accessToken: generateAccessToken(user.id, user.role),
      };
    } catch {
      throw new AppError("Invalid Refresh Token", 401);
    }
  }

  async sendEmailOtp(rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    await this.issueOtp(email, "EMAIL");
    return { message: "OTP sent to email" };
  }

  async verifyEmailOtp(rawEmail: string, otp: string, fullName?: string) {
    const email = normalizeEmail(rawEmail);
    await this.checkOtp(email, "EMAIL", otp);

    let user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      if (!fullName?.trim()) {
        throw new AppError("fullName is required to complete signup.", 400);
      }
      user = await this.authRepository.createVerifiedUser({
        fullName: fullName.trim(),
        email,
        provider: "EMAIL",
      });
    } else {
      await this.authRepository.linkVerifiedProvider(user.id, "EMAIL");
    }

    return this.issueSession(user);
  }

  async sendWhatsappOtp(rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    await this.issueOtp(phone, "WHATSAPP");
    return { message: "OTP sent via WhatsApp" };
  }

  async verifyWhatsappOtp(rawPhone: string, otp: string, fullName?: string) {
    const phone = normalizePhone(rawPhone);
    await this.checkOtp(phone, "WHATSAPP", otp);

    let user = await this.authRepository.findUserByPhone(phone);

    if (!user) {
      if (!fullName?.trim()) {
        throw new AppError("fullName is required to complete signup.", 400);
      }
      user = await this.authRepository.createVerifiedUser({
        fullName: fullName.trim(),
        phone,
        provider: "PHONE",
      });
    } else {
      await this.authRepository.linkVerifiedProvider(user.id, "PHONE");
    }

    return this.issueSession(user);
  }

  async loginWithGoogle(idToken: string) {
    const { googleId, email, name } = await verifyGoogleIdToken(idToken);

    const existingProvider =
      await this.authRepository.findAuthProviderByProviderUserId(
        "GOOGLE",
        googleId
      );
    if (existingProvider) {
      return this.issueSession((existingProvider as any).user);
    }

    let user = await this.authRepository.findUserByEmail(email);
    if (user) {
      await this.authRepository.linkVerifiedProvider(user.id, "GOOGLE", googleId);
      return this.issueSession(user);
    }

    user = await this.authRepository.createVerifiedUser({
      fullName: name,
      email,
      provider: "GOOGLE",
      providerUserId: googleId,
    });

    return this.issueSession(user);
  }

  private async issueOtp(identifier: string, channel: OtpChannel) {
    const recent = await this.authRepository.findLatestOtp(identifier, channel);
    if (recent) {
      const secondsSinceLast = (Date.now() - recent.createdAt.getTime()) / 1000;
      if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
        throw new AppError(
          `Please wait ${wait}s before requesting another code.`,
          429
        );
      }
    }

    const otp = generateOtp(6);
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.authRepository.createOtp({
      identifier,
      channel,
      otpHash,
      expiresAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
    });

    if (channel === "EMAIL") {
      await sendOtpEmail(identifier, otp);
    } else {
      await sendOtpWhatsapp(identifier, otp);
    }
  }

  private async checkOtp(identifier: string, channel: OtpChannel, otp: string) {
    const record = await this.authRepository.findLatestOtp(identifier, channel);

    if (!record) {
      throw new AppError(
        "No pending verification found. Please request a new code.",
        400
      );
    }
    if (record.expiresAt < new Date()) {
      throw new AppError("Code expired. Please request a new one.", 400);
    }
    if (record.attempts >= record.maxAttempts) {
      throw new AppError(
        "Too many incorrect attempts. Please request a new code.",
        429
      );
    }

    const isValid = await compareOtp(otp, record.otpHash);
    if (!isValid) {
      await this.authRepository.incrementOtpAttempts(record.id);
      throw new AppError("Incorrect code.", 400);
    }

    await this.authRepository.consumeOtp(record.id);
  }

  private issueSession(user: {
    id: string;
    role: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  }) {
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    return {
      message: "Login Successful",
      accessToken,
      refreshToken,
      user,
    };
  }
}