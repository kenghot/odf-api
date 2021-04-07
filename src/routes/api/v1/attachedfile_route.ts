import { Router } from "express";

import { controller } from "../../../controllers/v1/attachedfile_controller";

export const attachedFileRouter = Router();

attachedFileRouter
  .route("/:id")
  .put(controller.update)
  .delete(controller.delete);
