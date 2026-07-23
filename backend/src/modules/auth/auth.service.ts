import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { AuthRepository } from "./auth.repository";
import { RegisterUserDTO, LoginUserDTO } from "./auth.types";

import { AppError } from "../../utils/app-error";
import { env } from "../../config/env";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt";

export class AuthService {
  private authRepository = new AuthRepository();

  async register(data: RegisterUserDTO) {
    const existingUser = await this.authRepository.findUserByEmail(
      data.email
    );

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
    const user = await this.authRepository.findUserByEmail(
      data.email
    );

    if (!user) {
      throw new AppError("Invalid Email or Password", 401);
    }

    const authProvider =
      await this.authRepository.findEmailAuthProvider(user.id);

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

    const accessToken = generateAccessToken(
      user.id,
      user.role
    );

    const refreshToken = generateRefreshToken(
      user.id
    );

    return {
      message: "Login Successful",
      accessToken,
      refreshToken,
      user,
    };
  }

  async me(userId: string) {
    const user =
      await this.authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET
      ) as {
        id: string;
      };

      const user =
        await this.authRepository.findUserById(decoded.id);

      if (!user) {
        throw new AppError("User not found", 404);
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
        401
      );
    }
  }
}