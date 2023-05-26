import { Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import winston from "winston";

import { SignInPayload, SignUpPayload } from "@/contracts/auth";
import { userService } from "@/services";
import { IBodyRequest } from "@/contracts/request";
import { createHash } from "@/utils/hash";
import { jwtSign } from "@/utils/jwt";

export const authController = {
  signIn: async (
    { body: { email, password } }: IBodyRequest<SignInPayload>,
    res: Response
  ) => {
    try {
      const user = await userService.getByEmail(email);

      const comparePassword = user?.comparePassword(password);

      if (!user || !comparePassword)
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });

      const { accessToken } = jwtSign(user.id);

      return res.status(StatusCodes.OK).json({
        data: { accessToken },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (error) {
      winston.error(error);

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: ReasonPhrases.BAD_REQUEST,
      });
    }
  },
  signUp: async (
    { body: { email, password } }: IBodyRequest<SignUpPayload>,
    res: Response
  ) => {
    try {
      const isUserExist = await userService.isExistByEmail(email);

      if (isUserExist)
        return res.status(StatusCodes.CONFLICT).json({
          user: isUserExist,
          message: ReasonPhrases.CONFLICT,
          status: StatusCodes.CONFLICT,
        });

      const hashedPassword = await createHash(password);

      const user = await userService.create({
        email,
        password: hashedPassword,
      });

      const { accessToken } = jwtSign(user.id);

      return res.status(StatusCodes.OK).json({
        data: { accessToken },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK,
      });
    } catch (error) {
      winston.error(error);

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },
};
