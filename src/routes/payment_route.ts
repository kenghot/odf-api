import { Router } from "express";
import { paymentApiRouter } from "./api/v2/PaymentApiRoute";
import { authentication } from "../middlewares/app-authentication";
import { JwtGenerator } from "../services/JwtGenerator";
import { JwtAppStrategy } from "../middlewares/app-authentication/strategy/JwtAppStrategy";

const jwtGenerator = new JwtGenerator();

export const paymentRouter = Router();

paymentRouter.use(authentication(new JwtAppStrategy(jwtGenerator)));

paymentRouter.use([paymentApiRouter]);
