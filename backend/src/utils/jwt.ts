import jwt from "jsonwebtoken";
import { env } from "../config/index.js";

export interface JwtPayload {
  userId: number;
  email: string;
}

export const generateToken = (
  payload: JwtPayload
): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY as jwt.SignOptions["expiresIn"],
  });
};

export const verifyToken = (
  token: string
): JwtPayload => {
  return jwt.verify(
    token,
    env.JWT_SECRET
  ) as JwtPayload;
};