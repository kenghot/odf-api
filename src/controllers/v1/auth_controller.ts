import { RequestHandler } from "express";
import * as jwt from "jsonwebtoken";
import { ExtractJwt } from "passport-jwt";
import * as randomize from "randomatic";
import { DeepPartial, getManager, MoreThan } from "typeorm";

import { Blacklist } from "../../entities/Blacklist";
import { RefreshToken } from "../../entities/RefreshToken";
import { User } from "../../entities/User";
import {
  AuthError,
  DBError,
  ValidateError
} from "../../middlewares/error/error-type";
import { RefreshTokenRepository, UserRepository } from "../../repositories/v1";
import { jwtSign, jwtVerify } from "../../utils/async-jwt";
import { MINUTE_IN_MILLISECONDS } from "../../utils/constants";
import { transporter } from "../../utils/email-helper";

export interface IPayload {
  uid: string;
  permissions: string[];
  responsibilityOrganizationIds: number[];
}

export class AuthController {
  static signup: RequestHandler = async (req, res, next) => {
    const body: DeepPartial<User> = req.body;
    const { username, confirmPassword } = body;
    try {
      let user = await UserRepository.findOne({
        where: { username }
      });
      if (user) {
        return next(new AuthError({ message: "username already exist" }));
      }

      user = UserRepository.create(body);

      // user for validate because confirm_password is not column in db
      user.confirmPassword = confirmPassword;

      await UserRepository.save(user);
      res.send({ data: user });
    } catch (e) {
      next(e);
    }
  };

  static signin: RequestHandler = async (req, res, next) => {
    const user: DeepPartial<User> = req.user;
    const { id, permissions, responsibilityOrganizationIds } = user;
    const clientId = req.get("client_id");
    try {
      // generate access_token && refresh_token
      const [accessToken, refreshToken] = await AuthController.getSigninTokens(
        {
          uid: id.toString(),
          permissions,
          responsibilityOrganizationIds
        },
        clientId
      );

      // create RefreshToken
      const rf = RefreshTokenRepository.create();
      rf.refreshToken = refreshToken;
      rf.uid = id.toString();
      rf.clientId = clientId;

      // add more signin info to user
      user.lastSigninDate = new Date();
      user.lastSigninIp = req.ip;
      user.signinCount += 1;

      // add user, refresh_token && remove blacklist to db
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          await transactionEntityManager.save(user);
          await transactionEntityManager.save(rf);
          await transactionEntityManager.delete(Blacklist, {
            uid: id,
            clientId
          });
        } catch (e) {
          throw new DBError({
            name: "ไม่สามารถเข้าสู่ระบบได้",
            message: `ไม่สามารถเข้าสู่ระบบได้เนื่องจากระบบฐานข้อมูลมีปัญหา กรุณาลองเข้าระบบใหม่อีกครั้ง ${e.message}`
          });
        }
      });

      delete user.roles;
      delete user.responsibilityOrganizationIds;

      return res
        .set("x-access-token", accessToken)
        .set("uid", id.toString())
        .send({
          data: { ...user },
          success: true
        });
    } catch (e) {
      next(e);
    }
  };

  static getResetPasswordToken: RequestHandler = async (req, res, next) => {
    const { username } = req.body;
    try {
      const user = await UserRepository.findOne({ username });

      if (!user) {
        return next(
          new ValidateError({
            message: "ไม่พบรหัสผู้ใช้งาน, กรุณาลองใหม่อีกครั้ง",
            name: "ขอรหัสผ่านใหม่ไม่สำเร็จ"
          })
        );
      }

      const resetPasswordToken = AuthController.generateResetPasswordToken();

      user.resetPasswordToken = resetPasswordToken;

      // 10 miniute
      user.resetPasswordTokenExpiration =
        (Date.now() + 600000) / MINUTE_IN_MILLISECONDS;

      await UserRepository.save(user);
      await AuthController.sendResetEmail(user.email, resetPasswordToken);

      res.send({ data: { email: user.email }, success: true });
    } catch (e) {
      next(e);
    }
  };

  static confirmPasswordToken: RequestHandler = async (req, res, next) => {
    const clientId = req.get("client_id");
    const { resetPasswordToken } = req.body;
    try {
      const user = await UserRepository.findOne({
        where: {
          resetPasswordToken,
          reset_password_token_expiration: MoreThan(
            Date.now() / MINUTE_IN_MILLISECONDS
          )
        }
      });

      if (!user) {
        return next(
          new ValidateError({
            name: "ยืนยันรหัสไม่สำเร็จ",
            message: "รหัสยืนยัน 6 หลักไม่ถูกต้องกรุณาลองใหม่อีกครั้ง"
          })
        );
      }

      const oneMinuteToken = await AuthController.generateOneMinuteToken(
        clientId
      );

      return res
        .set("x-access-token", oneMinuteToken)
        .send({ data: { uid: user.id }, success: true });
    } catch (e) {
      next(e);
    }
  };

  static resetPassword: RequestHandler = async (req, res, next) => {
    const uid = req.get("uid");
    const { password, confirmPassword } = req.body;
    try {
      if (!uid) {
        return next(
          new ValidateError({
            name: "ไม่สามารถรีเซ็ทรหัสผ่านได้",
            message: "ไม่สามารถรีเซ็ทรหัสผ่านได้เนื่องจากไม่พบค่า uid"
          })
        );
      }

      const user = await UserRepository.findOne({ id: +uid });

      if (!user) {
        return next(
          new ValidateError({
            name: "ไม่สามารถรีเซ็ทรหัสผ่านได้",
            message: "ไม่สามารถรีเซ็ทรหัสผ่านได้เนื่องจากค่า uid ไม่ถูกต้อง"
          })
        );
      }

      user.password = password;
      user.confirmPassword = confirmPassword;

      await UserRepository.save(user);

      res.send({ success: true });
    } catch (e) {
      next(e);
    }
  };

  static renewToken: RequestHandler = async (req, res, next) => {
    const clientId = req.get("client_id");
    const uid = req.get("uid");

    const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    const expiredAccessToken = jwtFromRequest(req);

    if (!expiredAccessToken) {
      return next(new AuthError({ message: "Cannot find Access Token" }));
    }

    try {
      const rf = await RefreshTokenRepository.findOne({ uid, clientId });

      if (!rf) {
        return next(new AuthError({ message: "Cannot find Refresh Token" }));
      }

      await jwtVerify(
        rf.refreshToken,
        AuthController.getRefreshJWTSecretKey(clientId)
      );

      const payload: any = jwt.decode(expiredAccessToken);

      if (!payload) {
        return next(new AuthError({ message: "Cannot use this token" }));
      }

      const accessToken = await AuthController.generateAccessToken(
        {
          uid: payload.uid,
          permissions: payload.permissions,
          responsibilityOrganizationIds: payload.responsibilityOrganizationIds
        },
        clientId
      );

      return res.set("x-access-token", accessToken).send({
        success: true
      });
    } catch (e) {
      next(e);
    }
  };

  static signout: RequestHandler = async (req, res, next) => {
    const uid = req.get("uid");
    const clientId = req.get("client_id");
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          const blacklist = transactionEntityManager.create(Blacklist, {
            clientId,
            uid
          });
          await transactionEntityManager.save(blacklist);
          await transactionEntityManager.delete(RefreshToken, {
            clientId,
            uid
          });
        } catch (e) {
          next(
            new ValidateError({
              name: "ออกจากระบบไม่สมบูรณ์",
              message:
                "ออกจากระบบไม่สมบูรณ์ กรุณารอสักครู่แล้วลองออกจากระบบอีกครั้ง"
            })
          );
        }
      });
      res.send({ success: true });
    } catch (e) {
      next(e);
    }
  };

  private static getSigninTokens = async (
    payload: IPayload,
    clientId: string
  ) => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        AuthController.generateAccessToken(payload, clientId),

        AuthController.generateRefreshToken(payload.uid, clientId)
      ]);
      return [accessToken, refreshToken];
    } catch (e) {
      throw e;
    }
  };

  private static generateAccessToken = async (
    payload: IPayload,
    clientId: string
  ) => {
    const { uid, permissions, responsibilityOrganizationIds } = payload;
    try {
      const token = await jwtSign(
        { uid, permissions, responsibilityOrganizationIds },
        AuthController.getJWTSecretKey(clientId),
        { expiresIn: process.env.JWT_EXPIRED_IN }
      );

      return token;
    } catch (e) {
      throw e;
    }
  };

  private static generateRefreshToken = async (
    id: string,
    clientId: string
  ) => {
    try {
      const token = await jwtSign(
        { id },
        AuthController.getRefreshJWTSecretKey(clientId),
        { expiresIn: process.env.REFRESH_JWT_EXPIRED_IN }
      );

      return token;
    } catch (e) {
      throw e;
    }
  };

  private static generateOneMinuteToken = async (clientId: string) => {
    try {
      const token = await jwtSign(
        {},
        AuthController.getJWTSecretKey(clientId),
        { expiresIn: 60 * 1 }
      );

      return token;
    } catch (e) {
      throw e;
    }
  };

  private static generateResetPasswordToken = (): string => {
    return randomize("0", 6);
  };

  private static sendResetEmail = async (
    email: string,
    resetPasswordToken: string
  ) => {
    const mailOptions = {
      from: process.env.APP_EMAIL,
      to: email,
      subject:
        "ข้อแนะนำในการแก้ไขรหัสผ่านใหม่ของระบบให้บริการกู้ยืมเงินทุนประกอบอาชีพกองทุนผู้สูงอายุ กรมกิจการผู้สูงอายุ",
      html: `<h1>รหัสผ่าน 6 หลัก สำหรับยืนยันการแก้ไขรหัสผ่านคือ ${resetPasswordToken}</h1>`
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (e) {
      throw e;
    }
  };

  static getJWTSecretKey = (clientId: string) => {
    switch (clientId) {
      case "odf-website":
        return process.env.WEBSITE_JWT_SECRET_KEY;
    }
  };

  private static getRefreshJWTSecretKey = (clientId: string) => {
    switch (clientId) {
      case "odf-website":
        return process.env.WEBSITE_REFRESH_JWT_SECRET_KEY;
    }
  };
}
