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
      winston.error(error);
    }
  }

  public async successfullyVerified({ email }: { email: string }) {
    try {
      this.mailer.send({
        template: "successfullyVerified",
        message: {
          to: email,
          from: `"Successfully verified" ${mailUser}`,
          subject: "Successfully verified",
        },
        locals: { email, clientUrl: "http://localhost:3000" },
      });
    } catch (error) {
      winston.error(error);
    }
  }

  public async resetPassword({
    email,
    accessToken,
  }: {
    email: string;
    accessToken: string;
  }) {
    try {
      await this.mailer.send({
        template: "resetPassword",
        message: {
          to: email,
          from: `"Reset Password" ${mailUser}`,
          subject: "Reset Password",
        },
        locals: {
          clientUrl: "http://localhost:3000",
          accessToken,
        },
      });
    } catch (error) {
      winston.error(error);
    }
  }

  public async successfullyUpdatedPassword({ email }: { email: string }) {
    try {
      await this.mailer.send({
        template: "successfullyUpdatedPassword",
        message: {
          to: email,
          from: `"Password reset successfull" ${mailUser}`,
          subject: "Password Reset Successfull",
        },
        locals: { email, clientUrl: "http://localhost:3000" },
      });
    } catch (error) {
      winston.error(error);
    }
  }
}
