import { Router } from "express";

import { controller } from "../../../controllers/v1/receipt_controller";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const receiptRouter = Router();

receiptRouter
  .route("/")
  .get([filterByOrganization, controller.getMany(), paging, getEmptyList])
  .post(controller.create);

receiptRouter
  .route("/:id")
  .get(
    controller.getOne({
      relations: ["organization"]
    })
  )
  .put(controller.update)
  .delete(controller.delete);
