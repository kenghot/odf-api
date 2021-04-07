import { Router } from "express";
import * as multer from "multer";

import { controller } from "../../../controllers/v2/DebtCollectionVisitController";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { getStorage } from "../../../utils/multer-helper";

const storage = getStorage("letters");
const upload = multer({ storage });

const getVisit = controller.getOne({
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
          value: "VISIT.ATTACHEDFILE"
        }
      ]
    }
  ]
});

export const visitRouter = Router();

visitRouter.get("/", controller.getMany(), paging, getEmptyList);

visitRouter.get("/:id", getVisit, onSuccess());
visitRouter.put(
  "/:id",
  upload.any(),
  mapFiles,
  controller.withFormData,
  controller.update({ withFiles: true }),
  getVisit,
  onSuccess()
);
visitRouter.delete("/:id", controller.delete, onSuccess());

visitRouter.get("/:id/print_visit_form", controller.printVisitForm);
