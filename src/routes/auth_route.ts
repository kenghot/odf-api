import { Router } from "express";

import { AuthController } from "../controllers/v1/auth_controller";
import { authenticate } from "../middlewares/passport/authenticate";
import { authentication } from "../middlewares/app-authentication";
import { SimpleAppStrategy } from "../middlewares/app-authentication/strategy/SimpleAppStrategy";
import { JwtGenerator } from "../services/JwtGenerator";
import { AuthAppController } from "../controllers/v2/AuthAppController";
import { controller as voucherct } from "../controllers/v2/VoucherController";

const {
  checkUser,
  registerUser,
  registerPassword,
  signup,
  signin,
  getResetPasswordToken,
  confirmPasswordToken,
  resetPassword,
  renewToken,
  signout
} = AuthController;

const jwtGenerator = new JwtGenerator();
const authAppController = new AuthAppController(jwtGenerator);

export const authRouter = Router();

authRouter.post("/check_user", checkUser);

authRouter.post("/register_user", registerUser);

authRouter.post("/register_password", registerPassword);

authRouter.post("/signup", signup);

authRouter.post("/signin", authenticate("local"), signin);

authRouter.post("/new_password_request", getResetPasswordToken);

authRouter.post("/confirm_password_token", confirmPasswordToken);

authRouter.post("/reset_password", authenticate("jwt"), resetPassword);

authRouter.post("/renew_access_token", renewToken);

authRouter.post("/signout", signout);

authRouter.route("/ktb_create").post(voucherct.createKTBFileApi);

authRouter
  .route("/app_signin")
  .post([authentication(new SimpleAppStrategy()), authAppController.signin]);
