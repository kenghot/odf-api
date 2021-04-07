import { Router } from "express";

import { controller } from "../../../controllers/v2/RoleController";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery } from "../../../repositories/v2/SearchRepository";

const queries: IQuery[] = [
  { operator: "=", entityField: "isPrivate", queryField: "isPrivate" }
];

export const roleRouter = Router();

roleRouter
  .route("/")
  .get([
    controller.getMany({
      selectedFields: ["id", "name", "description", "isPrivate"],
      queries
    }),
    paging,
    getEmptyList
  ])
  .post(controller.create, onSuccess());

roleRouter
  .route("/:id")
  .get(
    controller.getOne({
      selectedFields: ["id", "name", "description", "permissions", "isPrivate"]
    }),
    onSuccess()
  )
  .put(controller.update(), onSuccess())
  .delete(controller.delete, onSuccess());
