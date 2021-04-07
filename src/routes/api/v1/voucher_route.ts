import { Router } from "express";
import * as multer from "multer";

import { controller } from "../../../controllers/v1/voucher_controller";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { fileFilter, getStorage } from "../../../utils/multer-helper";

const storage = getStorage("vouchers", { withDate: true });
const upload = multer({ storage, fileFilter: fileFilter("txt") });

const ktbFile = [{ name: "ktb", maxCount: 1 }];

export const voucherRouter = Router();

voucherRouter
  .route("/")
  .get([
    filterByOrganization,
    controller.getMany({ relations: ["organization", "voucherItems"] }),
    paging,
    getEmptyList
  ])
  .post(controller.create);

voucherRouter
  .route("/ktb")
  .post(controller.createKTBFile)
  .put([upload.fields([...ktbFile]), controller.updateVoucherByKTBFile]);

voucherRouter
  .route("/:id")
  .get(
    controller.getOne({
      relations: ["organization", "voucherItems"]
    })
  )
  .put(controller.update)
  .delete(controller.delete);

voucherRouter.route("/agreements").post(controller.createMany);
voucherRouter.get("/:id/print_receipt", controller.generateVoucherReceipt);
