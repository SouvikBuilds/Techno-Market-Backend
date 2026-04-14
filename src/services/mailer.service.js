import nodemailer from "nodemailer";
import { asyncHandler } from "../utils/index.js";
import { config } from "../config/config.js";

export const sendVerifyEmail = asyncHandler(async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });

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
