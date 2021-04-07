import { Router } from "express";

import { controller } from "../../../controllers/v1/agreement_controller";
import { ReportController } from "../../../controllers/v1/report_controller";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const agreementRouter = Router();

agreementRouter
  .route("/")
  .get([
    filterByOrganization,
    controller.getMany({
      selectedFields: [
        "id",
        "documentNumber",
        "agreementType",
        "name",
        "documentDate",
        "loanAmount",
        "status",
        "endDate"
      ],
      relations: ["organization", "request"]
    }),
    paging,
    getEmptyList
  ])
  .post(controller.create);

agreementRouter
  .route("/:id")
  .get(
    controller.getOne({
      relations: ["organization", "agreementItems", "guarantee", "request"]
    })
  )
  .put(controller.update)
  .delete(controller.delete);

agreementRouter.route("/requests").post(controller.createMany);

agreementRouter.get(
  "/:id/print_agreement",
  ReportController.createAgreementReport
);
