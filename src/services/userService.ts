import { User } from "@/models";

export const userService = {
  create: ({
    email,
    password,
    verified = false,
  }: {
    email: string;
    password: string;
    verified?: boolean;
  }) => new User({ email, password, verified }).save(),
  isExistByEmail: (email: string) => User.exists({ email }),
  getByEmail: (email: string) => User.findOne({ email }),
};
