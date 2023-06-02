import { Response, NextFunction } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";

import { IContextRequest, IUserRequest } from "@/contracts/request";

export const authGuards = {
  isGuest: (
    { context: { user } }: IContextRequest<IUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    if (!user) return next();

    return res.status(StatusCodes.FORBIDDEN).json({
      message: ReasonPhrases.FORBIDDEN,
      status: StatusCodes.FORBIDDEN,
    });
  },

  isAuth: (
    { context: { user } }: IContextRequest<IUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    if (user) return next();

    return res.status(StatusCodes.FORBIDDEN).json({
      message: ReasonPhrases.FORBIDDEN,
      status: StatusCodes.FORBIDDEN,
    });
  },
};
