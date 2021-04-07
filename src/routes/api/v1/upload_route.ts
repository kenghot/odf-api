import { Router } from "express";

import { UploadController } from "../../../controllers/v1/upload_controller";

export const uploadRouter = Router();

uploadRouter.route("/").post(UploadController.uploadMany);
