import { Router } from "express";

import { controller } from "../../../controllers/v1/organization_controller";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const organizationRouter = Router();

organizationRouter
  .route("/")
  .get([
    filterByOrganization,
    controller.getMany({ relations: ["parent"] }),
    paging,
    getEmptyList
  ])
  .post(controller.create);

organizationRouter
  .route("/:id")
  .get(
    controller.getOne({
      relations: [
        "requestSequence",
        "requestOnlineSequence",
        "agreementSequence",
        "guaranteeSequence",
        "voucherSequence",
        "parent"
      ]
    })
  )
  .put(controller.update)
  .delete(controller.delete);
