import { Request, Response, NextFunction } from "express";
import winston from "winston";

export const authMiddleware = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    Object.assign(req, { context: {} });

    return next();
  } catch (error) {
    winston.error(error);
  }
};
