import { Router } from "express";
import { PaymentController } from "../../../controllers/v2/PaymentController";
import { onSuccess } from "../../../middlewares/success-handler";

export const paymentApiRouter = Router();

// paymentApiRouter.route("/inquiry").post([PaymentController.verifyAccount]);
paymentApiRouter
  .route("/payment_validation")
  .get([PaymentController.verifyAccount, onSuccess()]);
paymentApiRouter
  .route("/payment")
  .post([PaymentController.confirmPayment, onSuccess()]);
paymentApiRouter
  .route("/cancel_validation")
  .get([PaymentController.verifyCancelPayment, onSuccess()]);
paymentApiRouter
  .route("/cancel_payment")
  .post([PaymentController.confirmCancelPayment, onSuccess()]);
