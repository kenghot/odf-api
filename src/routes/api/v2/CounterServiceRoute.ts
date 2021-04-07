import { Router } from "express";

import { controller as ct } from "../../../controllers/v2/CounterServiceController";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";

export const counterServiceRouter = Router();

const queries: IQuery[] = [
  {
    operator: "=",
    entityField: "TX_ID",
    queryField: "TX_ID"
  },
  {
    operator: "in",
    entityField: "METHOD",
    queryField: "METHOD"
  }
];
const subQueries: ISubQuery[] = [];

counterServiceRouter.get(
  "/printPaymentviaCounterServiceReport",
  ct.printPaymentviaCounterServiceReport
);

counterServiceRouter.get(
  "/printCancelPaymentviaCounterServiceReport",
  ct.printCancelPaymentviaCounterServiceReport
);

counterServiceRouter.get(
  "/printCounterServiceTransactionLogReport",
  ct.printCounterServiceTransactionLogReport
);

counterServiceRouter.route("/").get([
  ct.setParams,
  ct.getMany({
    queries,
    subQueries,
    orderBy: [{ entityField: "createdDate", orderType: "ASC" }]
  }),
  paging,
  getEmptyList
]);
