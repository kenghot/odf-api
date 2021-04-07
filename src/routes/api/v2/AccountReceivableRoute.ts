import { Router } from "express";

import multer = require("multer");
import { controller as ct } from "../../../controllers/v2/AccountReceivableController";
import { FormController } from "../../../controllers/v2/FormController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { getStorage } from "../../../utils/multer-helper";

const storage = getStorage("accountReceivables");
const upload = multer({ storage });

export const accountReceivableRouter = Router();

accountReceivableRouter
  .route("/")
  .get([filterByOrganization, ct.getAccountReceivables, paging, getEmptyList])
  .post(ct.create, onSuccess());

accountReceivableRouter.get("/debtcollections", [
  filterByOrganization,
  ct.getAccountReceivablesWithDebtCollection,
  paging,
  getEmptyList,
]);

accountReceivableRouter.get("/printPaymentReport", ct.printPaymentReport);

accountReceivableRouter.get(
  "/printPersonalRequestByProvinceReport",
  ct.printPersonalRequestByProvinceReport
);

accountReceivableRouter.get(
  "/printAccountRecievableReport",
  ct.printAccountRecievableReport
);

accountReceivableRouter.get("/printOverdueReport", ct.printOverdueReport);

accountReceivableRouter.get("/printAgeingReport", ct.printAgeingReport);

accountReceivableRouter.get(
  "/printCloseAccountReport",
  ct.printCloseAccountReport
);

accountReceivableRouter.get("/:id/print_form", ct.printAr);

accountReceivableRouter
  .route("/:id/acknowledge")
  .post(
    upload.any(),
    mapFiles,
    ct.withFormData,
    ct.onAcknowledge,
    ct.getAccountReceivable,
    onSuccess()
  )
  .put(
    upload.any(),
    mapFiles,
    ct.withFormData,
    ct.updateAcknowledge,
    ct.getAccountReceivable,
    onSuccess()
  );

accountReceivableRouter.post(
  "/:id/print_dept_acknowledge_form",
  FormController.printDebtAcknowledgeForm
);

accountReceivableRouter
  .route("/:id")
  .get(ct.getAccountReceivable, onSuccess())
  .put(ct.updateAccountReceivable, ct.getAccountReceivable, onSuccess())
  .delete(ct.delete, onSuccess());
