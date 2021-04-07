import { Router } from "express";

import { controller } from "../../../controllers/v1/role_controller";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const roleRouter = Router();

roleRouter
  .route("/")
  .get([
    controller.getMany({ selectedFields: ["id", "name", "description"] }),
    paging,
    getEmptyList
  ])
  .post(controller.create);

roleRouter
  .route("/:id")
  .get(
    controller.getOne({
      selectedFields: ["id", "name", "description", "permissions"]
    })
  )
  .put(controller.update)
  .delete(controller.delete);
