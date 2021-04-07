import * as passport from "passport";
import { ExtractJwt, Strategy, StrategyOptions } from "passport-jwt";

import {
  AuthController,
  IPayload
} from "../../../controllers/v1/auth_controller";
import { BlacklistRepostory } from "../../../repositories/v1";
import { AuthError } from "../../error/error-type";

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKeyProvider: (req, rawJwtToken, done) => {
    const clientId = req.get("client_id");
    const secret = AuthController.getJWTSecretKey(clientId);
    done(null, secret);
  },
  passReqToCallback: true
};

passport.use(
  new Strategy(opts, async (req, payload: IPayload, done) => {
    const { uid, permissions, responsibilityOrganizationIds } = payload;
    try {
      const clientId = req.get("client_id");
      const entity = await BlacklistRepostory.findOne({ uid, clientId });

      if (entity) {
        throw new AuthError({
          name: "ไม่สามารถเข้าใช้งานระบบได้",
          message:
            "โทเค็นปัจจุบันไม่สามารถใช้งานได้ ลองออกจากระบบแล้วเข้าสู่ระบบอีกครั้ง หรือติดต่อผู้ดูแลระบบ"
        });
      }

      // if (!user) return done(null, false);

      // return done(null, user);
      return done(null, {
        id: uid,
        permissions,
        responsibilityOrganizationIds
      });
    } catch (e) {
      done(e);
    }
  })
);
