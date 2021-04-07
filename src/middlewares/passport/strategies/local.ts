import * as passport from "passport";
import { IStrategyOptions, Strategy } from "passport-local";

import { RoleRepository, UserRepository } from "../../../repositories/v1";
import { ValidateError } from "../../error/error-type";

const opts: IStrategyOptions = {
  usernameField: "username",
  // passReqToCallback: true,
  session: false
};

passport.use(
  new Strategy(opts, async (username, password, done: any) => {
    try {
      const user = await UserRepository.findOne({
        select: [
          "id",
          "username",
          "email",
          "password",
          "firstname",
          "lastname",
          "title",
          "telephone",
          "registrationAgreement",
          "signinCount",
          "lastSigninDate",
          "lastSigninIp",
          "active",
          "position"
        ],
        relations: ["roles", "responsibilityOrganizations", "organization"],
        where: { username }
      });

      if (!user) {
        throw new ValidateError({
          message: "รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
          name: "ไม่สามารถเข้าสู่ระบบได้"
        });
      }

      if (!user.active) {
        throw new ValidateError({
          message: "บัญชีผู้ใช้งานยังไม่ถูกเปิดใช้, กรุณาติดต่อผู้ดูแลระบบ",
          name: "ไม่สามารถเข้าสู่ระบบได้"
        });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        throw new ValidateError({
          message: "รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
          name: "ไม่สามารถเข้าสู่ระบบได้"
        });
      }

      if (user.roles.length > 0) {
        const roles = await RoleRepository.findByIds(user.roles, {
          select: ["id", "name", "description", "permissions"]
        });

        user.roles = roles;
        user.getPermissions();
      }

      user.getResponsibilityOrganizationIds();

      return done(null, user);
    } catch (e) {
      done(e);
    }
  })
);
