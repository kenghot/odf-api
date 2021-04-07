import { Router } from "express";

import { controller as ct } from "../../../controllers/v2/PosController";
import { controller as shiftCt } from "../../../controllers/v2/PosShiftController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { posAuth } from "../../../middlewares/pos";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery } from "../../../repositories/v2/SearchRepository";

const queries: IQuery[] = [
  {
    operator: "like",
    entityField: "posCode",
    queryField: "posCode"
  },
  { operator: "=", entityField: "active", queryField: "active" },
  { operator: "in", entityField: "isOnline", queryField: "isOnline" },
  {
    operator: "in",
    entityField: "organizationId",
    queryField: "permittedOrganizationIds"
  }
];

const shiftQueries: IQuery[] = [
  { operator: "=", entityField: "posId", queryField: "posId" }
];

export const posRouter = Router();

posRouter.route("/:id/login").post([ct.login, ct.getPos(), onSuccess()]);

posRouter
  .route("/")
  .get([filterByOrganization, ct.getPoses({ queries }), paging, getEmptyList])
  .post(ct.create, onSuccess());

posRouter
  .route("/pos_receipt_control")
  .get(
    filterByOrganization,
    ct.getPosesWithReceiptControl,
    paging,
    getEmptyList
  );

posRouter
  .route("/:id/posshifts")
  .get([
    // posAuth,
    filterByOrganization,
    ct.setShiftParams,
    shiftCt.getMany({
      relations: ["currentCashier", "onDutymanager"],
      queries: shiftQueries,
      orderBy: [{ entityField: "startedShift", orderType: "DESC" }]
    }),
    paging,
    getEmptyList
  ])
  .post(shiftCt.canOpen, shiftCt.createPosShift(), onSuccess());

posRouter
  .route("/:id")
  .get(posAuth, ct.getPos(), onSuccess())
  .put(
    ct.update({
      relations: ["organization"]
    }),
    ct.getPos(),
    onSuccess()
  )
  .delete(ct.delete, onSuccess());
