import * as nodemailer from "nodemailer";

const poolConfig = {
  pool: true,
  // service: "gmail",
  host: process.env.APP_EMAIL_HOST,
  port: +process.env.APP_EMAIL_PORT,
  secure: true, // use TLS
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_EMAIL_PASS
  }
};

export const transporter = nodemailer.createTransport(poolConfig);
