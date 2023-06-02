import { Response } from "express";
import winston from "winston";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { UserMail } from "@/mailer";
import { userService, verificationService } from "@/services";
import { IParamsRequest } from "@/contracts/request";

export const userController = {
  verification: async (
    { params: { accessToken } }: IParamsRequest<{ accessToken: string }>,
    res: Response
  ) => {
    try {
      const verification = await verificationService.getByValidAccessToken(
        accessToken
      );

      if (!verification)
        return res.status(StatusCodes.FORBIDDEN).json({
          message: ReasonPhrases.FORBIDDEN,
          status: StatusCodes.FORBIDDEN,
        });

      const verifiedUser = await userService.updateVerificationAndEmailByUserId(
        verification.user,
        verification.email
      );

      if (!verifiedUser)
        return res.status(StatusCodes.FORBIDDEN).json({
          message: ReasonPhrases.FORBIDDEN,
          status: StatusCodes.FORBIDDEN,
        });

      await verifiedUser.save();
      await verificationService.deleteManyByUserId(verification.user);

      const userMail = new UserMail();

      await userMail.successfullyVerified({ email: verifiedUser.email });

      return res
        .status(StatusCodes.OK)
        .json({ message: ReasonPhrases.OK, status: StatusCodes.OK });
    } catch (error) {
      winston.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
