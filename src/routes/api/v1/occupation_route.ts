import { Router } from "express";

import { controller } from "../../../controllers/v1/occupation_controller";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const occupationRouter = Router();

occupationRouter
  .route("/")
  .get([controller.getMany(), paging, getEmptyList])
  .post(controller.create);

occupationRouter
  .route("/:id")
  .get(controller.getOne())
  .put(controller.update)
  .delete(controller.delete);
