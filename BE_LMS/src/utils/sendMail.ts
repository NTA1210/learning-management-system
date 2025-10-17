import resend from "../config/resend";
import { EMAIL_SENDER } from "../constants/env";

type Params = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendMailResult = { error?: string };

export const sendMail = async ({ to, subject, text, html }: Params) => {
  await resend.emails.send({
    from: EMAIL_SENDER,
    to,
    subject,
    text,
    html,
  });
};
