import { ObjectId } from "mongoose";
import { User } from "@/models";
import { IUser } from "@/contracts/user";

export const userService = {
  create: ({
    email,
    password,
    verified = false,
  }: {
    email: string;
    password: string;
    verified?: boolean;
  }) => new User({ email, password, verified }),
  isExistByEmail: (email: string) => User.exists({ email }),
  getByEmail: (email: string) => User.findOne({ email }),

  addVerificationToUser: async ({
    user,
    verificationId,
  }: {
    user: IUser;
    verificationId: ObjectId;
  }) => {
    if (!user.verifications) user.verifications = new Array<ObjectId>();

    user.verifications.push(verificationId);
  },
};
