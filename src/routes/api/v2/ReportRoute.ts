import { Router } from "express";
import { KTBController } from "../../../controllers/v2/KTBController";

export const reportRouter = Router();

const ktbReportCtl = new KTBController();

reportRouter.get(
  "/printPaymentviaKTBReport",
  ktbReportCtl.printPaymentviaKTBReport
);

reportRouter.get(
  "/printCancelPaymentviaKTBReport",
  ktbReportCtl.printCancelPaymentviaKTBReport
);

reportRouter.get(
  "/printKTBTransactionLogReport",
  ktbReportCtl.printKTBTransactionLogReport
);
