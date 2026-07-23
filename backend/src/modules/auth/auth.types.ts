/**
 * User Registration DTO
 */
export interface RegisterUserDTO {
  fullName: string;
  email: string;
  password: string;
}

/**
 * User Login DTO
 */
export interface LoginUserDTO {
  email: string;
  password: string;
}

/**
 * Refresh Access Token DTO
 */
export interface RefreshTokenDTO {
  refreshToken: string;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  id: string;
  role: string;
}