import { Request, Response, NextFunction } from "express";
import winston from "winston";

import { getAccessTokenFromHeaders } from "@/utils/headers";
import { jwtVerify } from "@/utils/jwt";
import { userService } from "@/services";
import { redis } from "@/dataSources/redis";

export const authMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    Object.assign(req, { context: {} });

    const { accessToken } = getAccessTokenFromHeaders(req.headers);
    if (!accessToken) return next();

    const { id } = jwtVerify({ accessToken });
    if (!id) return next();

    const isAccessTokenExpired = await redis.client.get(
      `expiredToken:${accessToken}`
    );
    console.log(isAccessTokenExpired);

    if (isAccessTokenExpired) return next();

    const user = await userService.getById(id);

    if (!user) return next();

    Object.assign(req, {
      context: {
        user,
        accessToken,
      },
    });

    return next();
  } catch (error) {
    winston.error(error);
    return next();
  }
};
