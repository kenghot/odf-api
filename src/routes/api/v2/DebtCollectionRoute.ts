import { Router } from "express";
import * as multer from "multer";

import { controller } from "../../../controllers/v2/DebtCollectionController";
import { controller as ctlLetter } from "../../../controllers/v2/DebtCollectionLetterController";
import { controller as ctlVisit } from "../../../controllers/v2/DebtCollectionVisitController";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { getStorage } from "../../../utils/multer-helper";
import { controller as reporter } from "../../../controllers/v2/DebtCollectionReportController";

const storage = getStorage("debtcollections");
const upload = multer({ storage });

export const debtCollectionRouter = Router();

debtCollectionRouter
  .route("/")
  .post([controller.canCreate, controller.create, onSuccess()]);

debtCollectionRouter.get("/printLitigationReport", reporter.printSueReport);
debtCollectionRouter.get(
  "/printDebtRepaymentReport",
  reporter.printDebtRepaymentReport
);
debtCollectionRouter.get(
  "/printDebtAcknowledgementReport",
  reporter.printDebtAcknowledgementReport
);
debtCollectionRouter.get("/printVisitReport", reporter.printVisitReport);
debtCollectionRouter.get(
  "/printPrescriptionReport",
  reporter.printPrescriptionReport
);

debtCollectionRouter.get(
  "/:id/print_cancel_borrower",
  ctlLetter.printCancelBorrowerReport
);

debtCollectionRouter.get(
  "/:id/print_cancel_gurantor",
  ctlLetter.printCancelGuarantorReport
);

debtCollectionRouter
  .route("/:id/letters")
  .get(ctlLetter.getMany(), paging, getEmptyList)
  .post(ctlLetter.createLetter, onSuccess());

debtCollectionRouter.get(
  "/letters/:id/print_letter",
  ctlLetter.printLetterReport
);

debtCollectionRouter
  .route("/:id/visits")
  .get(ctlVisit.getMany(), paging, getEmptyList)
  .post(ctlVisit.createVisit, onSuccess());

debtCollectionRouter
  .route("/:id")
  .get(controller.getDebtCollection, onSuccess())
  .put(
    upload.any(),
    mapFiles,
    controller.withFormData,
    controller.updateDebtCollection,
    controller.getDebtCollection,
    onSuccess()
  )
  .delete(controller.delete, onSuccess());
