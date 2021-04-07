import { Router } from "express";

import { controller } from "../../../controllers/v1/account_receivable_controller";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const accountReceivableRouter = Router();

accountReceivableRouter
  .route("/")
  .get([
    filterByOrganization,
    controller.getMany({ relations: ["organization"] }),
    paging,
    getEmptyList
  ])
  .post(controller.create);

accountReceivableRouter
  .route("/:id")
  .get(
    controller.getOne(
      {
        relations: [
          "organization",
          "transactions",
          "agreement",
          "agreement.agreementItems",
          "agreement.request",
          "agreement.request.requestItems",
          "guarantee",
          "guarantee.guaranteeItems"
        ]
      },
      true
    )
  )
  .put(controller.update)
  .delete(controller.delete);
