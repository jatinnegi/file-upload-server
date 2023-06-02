import { ObjectId } from "mongoose";
import { Verification } from "@/models";
import { createDateNow } from "@/utils/dates";

export const verificationService = {
  create: ({
    userId,
    email,
    accessToken,
    expiresIn,
  }: {
    userId: ObjectId;
    email: string;
    accessToken: string;
    expiresIn: Date;
  }) => new Verification({ user: userId, email, accessToken, expiresIn }),

  getByValidAccessToken: (accessToken: string) =>
    Verification.findOne({
      accessToken,
      expiresIn: { $gte: createDateNow() },
    }),

  deleteManyByUserId: (userId: ObjectId) =>
    Verification.deleteMany({ user: userId }),
};
