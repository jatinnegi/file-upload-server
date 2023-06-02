import { Response } from "express";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import winston from "winston";

import { ExpiresInDays } from "@/constants";
import {
  NewPasswordPayload,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
} from "@/contracts/auth";

import {
  userService,
  verificationService,
  resetPasswordService,
} from "@/services";
import { UserMail } from "@/mailer";
import { redis } from "@/dataSources";

import {
  IBodyRequest,
  ICombinedRequest,
  IContextRequest,
  IUserRequest,
} from "@/contracts/request";
import { createHash } from "@/utils/hash";
import { jwtSign } from "@/utils/jwt";
import { createCryptoString } from "@/utils/cryptoString";
import { createDateAddDaysFromNow } from "@/utils/dates";

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

      const user = userService.create({
        email,
        password: hashedPassword,
      });

      const cryptoString = createCryptoString();

      const dateFromNow = createDateAddDaysFromNow(ExpiresInDays.Verification);

      const verification = verificationService.create({
        userId: user.id,
        email: user.email,
        accessToken: cryptoString,
        expiresIn: dateFromNow,
      });

      userService.addVerificationToUser({
        user,
        verificationId: verification.id,
      });

      const { accessToken } = jwtSign(user.id);

      const userMail = new UserMail();

      // userMail.signUp({ email: user.email });
      userMail.verification({ email, accessToken: cryptoString });

      await user.save();
      await verification.save();

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

  signOut: async (
    { context: { user, accessToken } }: IContextRequest<IUserRequest>,
    res: Response
  ) => {
    try {
      await redis.client.set(`expiredToken:${accessToken}`, `${user.id}`, {
        EX: process.env.REDIS_TOKEN_EXPIRATION,
        NX: true,
      });

      return res
        .status(StatusCodes.OK)
        .json({ message: ReasonPhrases.OK, status: StatusCodes.OK });
    } catch (error) {
      winston.error(error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },

  resetPassword: async (
    { body: { email } }: IBodyRequest<ResetPasswordPayload>,
    res: Response
  ) => {
    try {
      const user = await userService.getByEmail(email);

      if (!user)
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });

      const cryptoString = createCryptoString();
      const dateFromNow = createDateAddDaysFromNow(ExpiresInDays.ResetPassword);

      const resetPassword = resetPasswordService.create({
        userId: user.id,
        accessToken: cryptoString,
        expiresIn: dateFromNow,
      });

      userService.addResetPasswordToUser({
        user,
        resetPasswordId: resetPassword.id,
      });

      const userMail = new UserMail();

      await userMail.resetPassword({ email, accessToken: cryptoString });

      await user.save();
      await resetPassword.save();

      return res.status(StatusCodes.OK).json({
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

  newPassword: async (
    req: ICombinedRequest<null, NewPasswordPayload, { accessToken: string }>,
    res: Response
  ) => {
    try {
      const { accessToken } = req.params;
      const { password } = req.body;

      if (!accessToken)
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });

      const resetPassword = await resetPasswordService.findByValidAccessToken(
        accessToken
      );

      if (!resetPassword)
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });

      const { user: userId } = resetPassword;

      const user = await userService.getById(userId);

      if (!user) {
        await resetPasswordService.deleteManyByUserId(userId);

        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });
      }

      const hashedPassword = await createHash(password);
      const updatedUser = await userService.updatePasswordByUserId(
        user.id,
        hashedPassword
      );

      if (!updatedUser)
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND,
        });

      await resetPasswordService.deleteManyByUserId(userId);
      await updatedUser.save();

      const userMail = new UserMail();

      await userMail.successfullyUpdatedPassword({ email: updatedUser.email });

      return res.status(StatusCodes.OK).json({
        data: { email: updatedUser.email },
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
