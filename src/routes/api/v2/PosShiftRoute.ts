import { Router } from "express";

import { controller as ct } from "../../../controllers/v2/PosShiftController";
import { controller as shiftLogCt } from "../../../controllers/v2/PosShiftLogController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { isPosManager, posAuth } from "../../../middlewares/pos";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery } from "../../../repositories/v2/SearchRepository";

const queries: IQuery[] = [
  {
    operator: "in",
    entityField: "posId",
    queryField: "posId"
  }
];

const logQueries: IQuery[] = [
  { operator: "=", entityField: "posShiftId", queryField: "posShiftId" }
];

export const posShiftRouter = Router();

const getShift = ct.getOne({
  relations: ["pos", "onDutymanager", "currentCashier"]
});

posShiftRouter.route("/").get([
  posAuth,
  filterByOrganization,
  ct.getMany({
    relations: ["pos", "onDutymanager", "currentCashier"],
    queries
  }),
  paging,
  getEmptyList
]);

posShiftRouter
  .route("/:id/posshiftlogs")
  .get([
    posAuth,
    filterByOrganization,
    ct.setLogParams,
    shiftLogCt.getMany({ queries: logQueries }),
    paging,
    getEmptyList
  ]);

posShiftRouter
  .route("/:id")
  .get(posAuth, getShift, ct.getCalculateFieldShift, onSuccess())
  .put(posAuth, isPosManager, ct.updatePosShift, getShift, onSuccess());
// .delete(ct.delete, onSuccess());
