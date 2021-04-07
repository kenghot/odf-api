import { Router } from "express";

import { controller as ct } from "../../../controllers/v2/AccountReceivableTransactionController";
import { onSuccess } from "../../../middlewares/success-handler";

export const accountReceivableTransactionRouter = Router();

accountReceivableTransactionRouter.route("/").post(ct.create, onSuccess());

accountReceivableTransactionRouter
  .route("/:id")
  .get(ct.getOne(), onSuccess())
  .put(ct.update(), ct.getOne(), onSuccess())
  .delete(ct.delete, onSuccess());
