import { ObjectId } from "mongoose";
import { ResetPassword } from "@/models/resetPassword";
import { createDateNow } from "@/utils/dates";

export const resetPasswordService = {
  create: ({
    userId,
    accessToken,
    expiresIn,
  }: {
    userId: ObjectId;
    accessToken: string;
    expiresIn: Date;
  }) => new ResetPassword({ user: userId, accessToken, expiresIn }),

  findByValidAccessToken: (accessToken: string) =>
    ResetPassword.findOne({
      accessToken,
      expiresIn: {
        $gte: createDateNow(),
      },
    }),

  deleteManyByUserId: (userId: ObjectId) =>
    ResetPassword.deleteMany({ user: userId }),
};
