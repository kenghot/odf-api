import { Router } from "express";
import * as multer from "multer";

import { controller } from "../../../controllers/v2/DebtCollectionLetterController";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { getStorage } from "../../../utils/multer-helper";

const storage = getStorage("letters");
const upload = multer({ storage });

const getLetter = controller.getOne({
  joins: [
    {
      type: "leftJoinAndMapMany",
      mapToField: "attachedFiles",
      joinEntityClass: "AttachedFile",
      joinEntityAlias: "attachedFile",
      conditions: [
        { joinFieldToMap: "refId", operator: "=", entityFieldToMap: "id" },
        {
          joinFieldToMap: "refType",
          operator: "=",
          queryField: "refType",
          value: "LETTER.ATTACHEDFILE"
        }
      ]
    }
  ]
});

export const letterRouter = Router();

letterRouter.get("/", controller.getMany(), paging, getEmptyList);

letterRouter.get("/:id", getLetter, onSuccess());
letterRouter.put(
  "/:id",
  upload.any(),
  mapFiles,
  controller.withFormData,
  controller.update({ withFiles: true }),
  getLetter,
  onSuccess()
);
letterRouter.delete("/:id", controller.delete, onSuccess());
