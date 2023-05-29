import winston from "winston";
import { Mailer } from "./mailer";

const mailUser = process.env.MAIL_USER;

export class UserMail extends Mailer {
  public async signUp({ email }: { email: string }) {
    try {
      await this.mailer.send({
        template: "signUp",
        message: {
          from: `"Sign Up" ${mailUser}`,
          to: email,
          subject: "Sign Up",
        },
      });
    } catch (error) {
      console.log(error);
      winston.error(error);
    }
  }

  public async verification({
    email,
    accessToken,
  }: {
    email: string;
    accessToken: string;
  }) {
    try {
      await this.mailer.send({
        template: "verification",
        message: {
          from: `"Verification" ${mailUser}`,
          to: email,
          subject: "Verification",
        },
        locals: {
          email,
          clientUrl: "http://localhost:3000",
          accessToken,
        },
      });
    } catch (error) {
      console.log(error);
      winston.error(error);
    }
  }
}
