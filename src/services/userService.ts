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

  getById: (userId: ObjectId) => User.findById(userId),

  getByEmail: (email: string) => User.findOne({ email }),

  updatePasswordByUserId: async function (userId: ObjectId, password: string) {
    const user = await this.getById(userId);

    if (!user) return null;

    user.resetPasswords = new Array<ObjectId>();
    user.password = password;

    return user;
  },

  updateVerificationAndEmailByUserId: async function (
    userId: ObjectId,
    email: string
  ) {
    const user = await this.getById(userId);

    if (!user || user.email !== email) return null;

    user.verifications = new Array<ObjectId>();
    user.verified = true;

    return user;
  },

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

  addResetPasswordToUser: async ({
    user,
    resetPasswordId,
  }: {
    user: IUser;
    resetPasswordId: ObjectId;
  }) => {
    if (!user.resetPasswords) user.resetPasswords = new Array<ObjectId>();

    user.resetPasswords.push(resetPasswordId);
  },
};
