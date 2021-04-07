import { RequestHandler } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import passport = require("passport");
import { AuthController } from "../../controllers/v1/auth_controller";
import { AuthError } from "../error/error-type";

export const authenticate = (strategy: string): RequestHandler => {
  return (req, res, next) => {
    passport.authenticate(strategy, { session: false }, (err, user, info) => {
      if (err) return next(err);

      if (info) {
        // const refresh_token = req.get("refresh_token");
        // if (refresh_token) {
        //     return AuthController.renewToken(req, res, next);
        // }
        // return next(
        //     new TokenExpiredError(info.message, info.expiredAt)
        // );
        return next(
          new AuthError({
            message: info.message,
            name: info.name
          })
        );
      }

      req.user = user;
      next();
    })(req, res, next);
  };
};
