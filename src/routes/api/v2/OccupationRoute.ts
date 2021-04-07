import { Router } from "express";

import { controller } from "../../../controllers/v2/OccupationController";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery } from "../../../repositories/v2/SearchRepository";

export const queries: IQuery[] = [
  {
    operator: "=",
    entityField: "active",
    queryField: "active"
  }
];

export const occupationRouter = Router();

occupationRouter
  .route("/")
  .get([controller.getMany({ queries }), paging, getEmptyList])
  .post(controller.create, onSuccess());

occupationRouter
  .route("/:id")
  .get(controller.getOne(), onSuccess())
  .put(controller.update(), onSuccess())
  .delete(controller.delete, onSuccess());
