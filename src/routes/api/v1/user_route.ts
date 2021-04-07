import { Router } from "express";
import * as multer from "multer";

import { controller } from "../../../controllers/v1/user_controller";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { getStorage } from "../../../utils/multer-helper";

export const userRouter = Router();

const storage = getStorage("users");
const upload = multer({ storage });

userRouter
  .route("/")
  .get([
    filterByOrganization,
    controller.getMany({
      relations: ["organization"],
      selectedFields: [
        "id",
        "username",
        "firstname",
        "lastname",
        "lastSigninDate",
        "active"
      ]
    }),
    paging,
    getEmptyList
  ])
  .post([controller.create]);

userRouter
  .route("/:id")
  .get(controller.getOne())
  .put([upload.any(), mapFiles, controller.update, controller.getOne()])
  .delete(controller.delete);
