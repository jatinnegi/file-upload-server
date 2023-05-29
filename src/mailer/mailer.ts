import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import Email, { EmailConfig } from "email-templates";

import { joinRelativeToMainPath } from "@/utils/paths";

export abstract class Mailer {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  protected mailer: Email;

  constructor() {
    this.createTransporter();
    this.initializeMailer();
  }

  private initializeMailer() {
    this.mailer = new Email<EmailConfig>({
      views: {
        root: joinRelativeToMainPath(process.env.MAIL_TPL_PATH),
        options: { extension: "ejs" },
      },
      preview: false,
      send: true,
      transport: this.transporter,
    });
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }
}
