import { Router } from "express";

import { controller } from "../../../controllers/v1/guarantee_controller";
import { ReportController } from "../../../controllers/v1/report_controller";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const guaranteeRouter = Router();

guaranteeRouter
  .route("/")
  .get([
    filterByOrganization,
    controller.getMany({
      selectedFields: [
        "id",
        "documentNumber",
        "guaranteeType",
        "name",
        "loanAmount",
        "documentDate",
        "status",
        "endDate"
      ],
      relations: ["organization"]
    }),
    paging,
    getEmptyList
  ])
  .post(controller.create);

guaranteeRouter
  .route("/:id")
  .get(
    controller.getOne({
      relations: ["organization", "guaranteeItems", "agreement", "request"]
    })
  )
  .put(controller.update)
  .delete(controller.delete);

guaranteeRouter.get(
  "/:id/print_guarantee",
  ReportController.createGuaranteeReport
);
