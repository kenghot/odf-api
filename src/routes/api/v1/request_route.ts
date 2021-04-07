import { Router } from "express";
import * as multer from "multer";

import { ReportController } from "../../../controllers/v1/report_controller";
import { controller } from "../../../controllers/v1/request_controller";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { getStorage } from "../../../utils/multer-helper";

const storage = getStorage("requests");
const upload = multer({ storage });

export const requestRouter = Router();

requestRouter
  .route("/")
  .get([
    filterByOrganization,
    controller.getMany({
      selectedFields: [
        "id",
        "documentNumber",
        "requestType",
        "name",
        "documentDate",
        "status"
      ],
      relations: ["organization"]
    }),
    paging,
    getEmptyList
  ])
  .post(controller.create);

requestRouter
  .route("/:id")
  .get(controller.getOne())
  .put(controller.update, controller.getOne())
  .delete(controller.delete);

requestRouter.put("/:id/factsheet", [
  upload.any(),
  mapFiles,
  controller.withFormDataFactSheet,
  controller.createOrUpdateFactSheet,
  controller.getOne()
]);

requestRouter.get("/:id/print_form", ReportController.createRequestReport);

requestRouter.get(
  "/:id/print_agreement_example",
  ReportController.createAgreementExampleReport
);
requestRouter.get(
  "/:id/print_guarantee_example",
  ReportController.createGuaranteeExampleReport
);
requestRouter.post(
  "/print_request_committee",
  ReportController.createRequestCommitee
);

requestRouter.post("/verify_borrower", controller.verifyBorrower);
requestRouter.post("/verify_guarantor", controller.verifyGuarantor);

requestRouter.get("/:id/request_report", ReportController.createRequestReport);

requestRouter.put("/:id/request_items/:subId/:resource", [
  upload.any(),
  mapFiles,
  controller.updateAttachedFiles,
  controller.getOne()
]);
