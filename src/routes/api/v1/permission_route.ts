import { Router } from "express";

import { PermissionController } from "../../../controllers/v1/permission_controller";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";

export const permissionRouter = Router();

permissionRouter
  .route("/")
  .get([PermissionController.getMany, paging, getEmptyList]);
