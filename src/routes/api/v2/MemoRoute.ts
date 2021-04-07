import { Router } from "express";
import * as multer from "multer";

import { controller } from "../../../controllers/v2/MemoController";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { getStorage } from "../../../utils/multer-helper";

const storage = getStorage("memos");
const upload = multer({ storage });

const getMemo = controller.getOne({
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
          value: "MEMO.ATTACHEDFILE"
        }
      ]
    }
  ]
});

export const memoRouter = Router();

memoRouter.get("/", controller.getMany(), paging, getEmptyList);
memoRouter.post(
  "/",
  controller.create,
  // controller.setDebtCollectParam,
  // getDebtCollection,
  onSuccess()
);

memoRouter.get("/:id", getMemo, onSuccess());
memoRouter.put(
  "/:id",
  upload.any(),
  mapFiles,
  controller.withFormData,
  controller.update({ withFiles: true }),
  getMemo,
  onSuccess()
);
memoRouter.delete("/:id", controller.delete, onSuccess());
memoRouter.get("/:id/print_form", controller.printMemoForm);
