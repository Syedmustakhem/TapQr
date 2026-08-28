import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { AuthRepository } from "./auth.repository";
import { RegisterUserDTO, LoginUserDTO } from "./auth.types";

import { AppError } from "../../cores/errors/AppError";
import { env } from "../../config/env";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./jwt";

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
type AuthMode = "register" | "login";

export class AuthService {
  private authRepository = new AuthRepository();

  /*
  |--------------------------------------------------------------------------
  | OLD PASSWORD REGISTRATION
  |--------------------------------------------------------------------------
  | Kept for now so we don't break existing backend routes.
  | We can remove this later after OTP authentication is fully tested.
  */

  async register(data: RegisterUserDTO) {
    const email = normalizeEmail(data.email);

    const existingUser =
      await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new AppError(
        "An account with this email already exists. Please login instead.",
        409,
        "EMAIL_EXISTS"
      );
    }

    const passwordHash = await bcrypt.hash(
      data.password,
      10
    );

    const user =
      await this.authRepository.registerUser({
        fullName: data.fullName.trim(),
        email,
        passwordHash,
      });

    return {
      message: "User Registered Successfully",
      user,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | OLD PASSWORD LOGIN
  |--------------------------------------------------------------------------
  | Kept for compatibility for now.
  */

  async login(data: LoginUserDTO) {
    const email = normalizeEmail(data.email);

    const user =
      await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new AppError(
        "Invalid Email or Password",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const authProvider =
      await this.authRepository.findAuthProviderByUserId(
        user.id
      );

    if (
      !authProvider ||
      !authProvider.passwordHash
    ) {
      throw new AppError(
        "Invalid Email or Password",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        data.password,
        authProvider.passwordHash
      );

    if (!isPasswordValid) {
      throw new AppError(
        "Invalid Email or Password",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    return this.issueSession(user);
  }

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  async logout() {
    return {
      success: true,
      message: "Logout successful",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CURRENT USER
  |--------------------------------------------------------------------------
  */

  async me(userId: string) {
    const user =
      await this.authRepository.findUserById(userId);

    if (!user) {
      throw new AppError(
        "User not found",
        404,
        "USER_NOT_FOUND"
      );
    }

    return user;
  }

  /*
  |--------------------------------------------------------------------------
  | REFRESH TOKEN
  |--------------------------------------------------------------------------
  */

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET
      ) as {
        id: string;
      };

      const user =
        await this.authRepository.findUserById(
          decoded.id
        );

      if (!user) {
        throw new AppError(
          "User not found",
          404,
          "USER_NOT_FOUND"
        );
      }

      return {
        accessToken: generateAccessToken(
          user.id,
          user.role
        ),
      };
    } catch {
      throw new AppError(
        "Invalid Refresh Token",
        401,
        "INVALID_REFRESH_TOKEN"
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | EMAIL OTP - SEND
  |--------------------------------------------------------------------------
  |
  | REGISTER:
  |   Email must NOT already exist.
  |
  | LOGIN:
  |   Email MUST already exist.
  |
  */

  async sendEmailOtp(
    rawEmail: string,
    mode: AuthMode
  ) {
    const email = normalizeEmail(rawEmail);

    const existingUser =
      await this.authRepository.findUserByEmail(
        email
      );

    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */

    if (mode === "register") {
      if (existingUser) {
        throw new AppError(
          "An account with this email already exists. Please login instead.",
          409,
          "EMAIL_EXISTS"
        );
      }

      await this.issueOtp(
        email,
        "EMAIL"
      );

      return {
        message: "OTP sent to email",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    if (!existingUser) {
      throw new AppError(
        "No account found with this email. Please register first.",
        404,
        "ACCOUNT_NOT_FOUND"
      );
    }

    await this.issueOtp(
      email,
      "EMAIL",
      existingUser.fullName
    );

    return {
      message: "OTP sent to email",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | EMAIL OTP - VERIFY
  |--------------------------------------------------------------------------
  */

  async verifyEmailOtp(
    rawEmail: string,
    otp: string,
    mode: AuthMode,
    fullName?: string
  ) {
    const email = normalizeEmail(rawEmail);

    const existingUser =
      await this.authRepository.findUserByEmail(
        email
      );

    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */

    if (mode === "register") {
      /*
       * Check again here.
       *
       * This is important because someone could register
       * the email between SEND OTP and VERIFY OTP.
       */

      if (existingUser) {
        throw new AppError(
          "An account with this email already exists. Please login instead.",
          409,
          "EMAIL_EXISTS"
        );
      }

      await this.checkOtp(
        email,
        "EMAIL",
        otp
      );

      if (!fullName?.trim()) {
        throw new AppError(
          "Full name is required to complete signup.",
          400,
          "FULL_NAME_REQUIRED"
        );
      }

      const user =
        await this.authRepository.createVerifiedUser({
          fullName: fullName.trim(),
          email,
          provider: "EMAIL",
        });

      return this.issueSession(user);
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    if (!existingUser) {
      throw new AppError(
        "No account found with this email. Please register first.",
        404,
        "ACCOUNT_NOT_FOUND"
      );
    }

    await this.checkOtp(
      email,
      "EMAIL",
      otp
    );

    /*
     * Existing account.
     *
     * Mark/link the email provider as verified.
     */

    await this.authRepository.linkVerifiedProvider(
      existingUser.id,
      "EMAIL"
    );

    return this.issueSession(
      existingUser
    );
  }

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP OTP - SEND
  |--------------------------------------------------------------------------
  */

  async sendWhatsappOtp(
    rawPhone: string,
    mode: AuthMode
  ) {
    const phone = normalizePhone(rawPhone);

    const existingUser =
      await this.authRepository.findUserByPhone(
        phone
      );

    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */

    if (mode === "register") {
      if (existingUser) {
        throw new AppError(
          "An account with this WhatsApp number already exists. Please login instead.",
          409,
          "PHONE_EXISTS"
        );
      }

      await this.issueOtp(
        phone,
        "WHATSAPP"
      );

      return {
        message: "OTP sent via WhatsApp",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    if (!existingUser) {
      throw new AppError(
        "No account found with this WhatsApp number. Please register first.",
        404,
        "ACCOUNT_NOT_FOUND"
      );
    }

    await this.issueOtp(
      phone,
      "WHATSAPP"
    );

    return {
      message: "OTP sent via WhatsApp",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP OTP - VERIFY
  |--------------------------------------------------------------------------
  */

  async verifyWhatsappOtp(
    rawPhone: string,
    otp: string,
    mode: AuthMode,
    fullName?: string
  ) {
    const phone = normalizePhone(rawPhone);

    const existingUser =
      await this.authRepository.findUserByPhone(
        phone
      );

    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */

    if (mode === "register") {
      /*
       * Check again during verification.
       * Prevents race-condition duplicate registration.
       */

      if (existingUser) {
        throw new AppError(
          "An account with this WhatsApp number already exists. Please login instead.",
          409,
          "PHONE_EXISTS"
        );
      }

      await this.checkOtp(
        phone,
        "WHATSAPP",
        otp
      );

      if (!fullName?.trim()) {
        throw new AppError(
          "Full name is required to complete signup.",
          400,
          "FULL_NAME_REQUIRED"
        );
      }

      const user =
        await this.authRepository.createVerifiedUser({
          fullName: fullName.trim(),
          phone,
          provider: "PHONE",
        });

      return this.issueSession(user);
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    if (!existingUser) {
      throw new AppError(
        "No account found with this WhatsApp number. Please register first.",
        404,
        "ACCOUNT_NOT_FOUND"
      );
    }

    await this.checkOtp(
      phone,
      "WHATSAPP",
      otp
    );

    await this.authRepository.linkVerifiedProvider(
      existingUser.id,
      "PHONE"
    );

    return this.issueSession(
      existingUser
    );
  }

  /*
  |--------------------------------------------------------------------------
  | GOOGLE AUTHENTICATION
  |--------------------------------------------------------------------------
  |
  | REGISTER:
  |   Existing email -> reject.
  |
  | LOGIN:
  |   Existing account -> login.
  |   Missing account -> reject.
  |
  */

  async loginWithGoogle(
    idToken: string,
    mode: AuthMode
  ) {
    const {
      googleId,
      email,
      name,
    } = await verifyGoogleIdToken(
      idToken
    );

    const existingProvider =
      await this.authRepository
        .findAuthProviderByProviderUserId(
          "GOOGLE",
          googleId
        );

    /*
    |--------------------------------------------------------------------------
    | GOOGLE PROVIDER ALREADY LINKED
    |--------------------------------------------------------------------------
    */

    if (existingProvider) {
      /*
       * If this is REGISTER, don't silently turn
       * registration into login.
       */

      if (mode === "register") {
        throw new AppError(
          "This Google account is already registered. Please login instead.",
          409,
          "GOOGLE_ACCOUNT_EXISTS"
        );
      }

      return this.issueSession(
        existingProvider.user
      );
    }

    const existingUser =
      await this.authRepository.findUserByEmail(
        email
      );

    /*
    |--------------------------------------------------------------------------
    | GOOGLE REGISTER
    |--------------------------------------------------------------------------
    */

    if (mode === "register") {
      if (existingUser) {
        throw new AppError(
          "An account with this email already exists. Please login instead.",
          409,
          "EMAIL_EXISTS"
        );
      }

      const user =
        await this.authRepository.createVerifiedUser({
          fullName: name.trim(),
          email,
          provider: "GOOGLE",
          providerUserId: googleId,
        });

      return this.issueSession(user);
    }

    /*
    |--------------------------------------------------------------------------
    | GOOGLE LOGIN
    |--------------------------------------------------------------------------
    */

    if (!existingUser) {
      throw new AppError(
        "No account found with this Google account. Please register first.",
        404,
        "ACCOUNT_NOT_FOUND"
      );
    }

    /*
     * The email already belongs to a TapQR user.
     * Link the Google provider to that account.
     */

    await this.authRepository.linkVerifiedProvider(
      existingUser.id,
      "GOOGLE",
      googleId
    );

    return this.issueSession(
      existingUser
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE + SEND OTP
  |--------------------------------------------------------------------------
  */

  private async issueOtp(
    identifier: string,
    channel: OtpChannel,
    emailDisplayName?: string
  ) {
    const recent =
      await this.authRepository.findLatestOtp(
        identifier,
        channel
      );

    if (recent) {
      const secondsSinceLast =
        (Date.now() -
          recent.createdAt.getTime()) /
        1000;

      if (
        secondsSinceLast <
        OTP_RESEND_COOLDOWN_SECONDS
      ) {
        const wait = Math.ceil(
          OTP_RESEND_COOLDOWN_SECONDS -
            secondsSinceLast
        );

        throw new AppError(
          `Please wait ${wait}s before requesting another code.`,
          429,
          "OTP_COOLDOWN"
        );
      }
    }

    const otp = generateOtp(6);

    const otpHash =
      await hashOtp(otp);

    const expiresAt =
      new Date(
        Date.now() +
          OTP_TTL_MINUTES * 60 * 1000
      );

    await this.authRepository.createOtp({
      identifier,
      channel,
      otpHash,
      expiresAt,
      maxAttempts:
        OTP_MAX_ATTEMPTS,
    });

    if (channel === "EMAIL") {
      await sendOtpEmail(
        identifier,
        otp,
        emailDisplayName || "there"
      );
    } else {
      await sendOtpWhatsapp(
        identifier,
        otp
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | VERIFY OTP
  |--------------------------------------------------------------------------
  */

  private async checkOtp(
    identifier: string,
    channel: OtpChannel,
    otp: string
  ) {
    const record =
      await this.authRepository.findLatestOtp(
        identifier,
        channel
      );

    if (!record) {
      throw new AppError(
        "No pending verification found. Please request a new code.",
        400,
        "OTP_NOT_FOUND"
      );
    }

    if (
      record.expiresAt <
      new Date()
    ) {
      throw new AppError(
        "Code expired. Please request a new one.",
        400,
        "OTP_EXPIRED"
      );
    }

    if (
      record.attempts >=
      record.maxAttempts
    ) {
      throw new AppError(
        "Too many incorrect attempts. Please request a new code.",
        429,
        "OTP_LOCKED"
      );
    }

    const isValid =
      await compareOtp(
        otp,
        record.otpHash
      );

    if (!isValid) {
      await this.authRepository.incrementOtpAttempts(
        record.id
      );

      throw new AppError(
        "Incorrect code.",
        400,
        "OTP_INVALID"
      );
    }

    await this.authRepository.consumeOtp(
      record.id
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ISSUE SESSION
  |--------------------------------------------------------------------------
  */

  private issueSession(user: {
    id: string;
    role: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  }) {
    const accessToken =
      generateAccessToken(
        user.id,
        user.role
      );

    const refreshToken =
      generateRefreshToken(
        user.id
      );

    return {
      message:
        "Authentication Successful",
      accessToken,
      refreshToken,
      user,
    };
  }
}