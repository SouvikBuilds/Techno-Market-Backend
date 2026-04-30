import nodemailer from "nodemailer";
import { asyncHandler } from "../utils/index.js";
import { config } from "../config/config.js";
import { transporter } from "../utils/index.js";
export const sendVerifyEmail = asyncHandler(async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Techno Market" <${config.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email send: ", result.messageId);
    return result;
  } catch (error) {
    console.log("Error while sending email: ", error);
    throw error;
  }
});

export const sendInterestedMail = asyncHandler(async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Techno Market" <${config.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email send: ", result.messageId);
    return result;
  } catch (error) {
    console.log("Error while sending email: ", error);
    throw error;
  }
});
