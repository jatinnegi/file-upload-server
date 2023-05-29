import { ObjectId } from "mongoose";
import { Verification } from "@/models";

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
};
