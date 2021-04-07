import { Router } from "express";

import { OfficeController } from "../../../controllers/v2/OfficePaymentController";
import { controller as ct } from "../../../controllers/v2/ReceiptController";
import { controller as rplCt } from "../../../controllers/v2/ReceiptPringLogController";
import { controller as ctReport } from "../../../controllers/v2/ReceiptReportController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { isPosManager, posAuth } from "../../../middlewares/pos";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";

const queries: IQuery[] = [
  { operator: "=", entityField: "posShiftId", queryField: "posShiftId" },
  {
    operator: "like",
    entityField: "documentNumber",
    queryField: "documentNumber",
  },
  {
    operator: "in",
    entityField: "organizationId",
    queryField: "permittedOrganizationIds",
  },
  {
    operator: "=",
    entityField: "status",
    queryField: "status",
  },
  {
    operator: ">=",
    entityField: "paidDate",
    queryField: "startDate",
  },
  {
    operator: "<=",
    entityField: "paidDate",
    queryField: "endDate",
  },
  {
    operator: "=",
    entityField: "clientType",
    queryField: "clientType",
  },
  {
    operator: "like",
    entityField: "clientName",
    queryField: "clientName",
  },
  {
    operator: "like",
    entityField: "clientTaxNumber",
    queryField: "clientTaxNumber",
  },
];

export const subQueries: ISubQuery[] = [
  {
    operator: "in",
    entityField: "posShiftId",
    subEntityClass: "PosShift",
    alias: "shift",
    subEntityField: "id",
    queries: [
      {
        operator: "=",
        entityField: "posId",
        queryField: "posId",
      },
    ],
  },
];

const updateReceipt = ct.update({
  relations: ["organization", "receiptItems", "receiptPrintLogs"],
  o2ms: [
    { entityField: "receiptItems", entityClass: "ReceiptItem" },
    { entityField: "receiptPrintLogs", entityClass: "ReceiptPrintLog" },
  ],
});

export const receiptRouter = Router();

receiptRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({
      relations: ["organization", "receiptItems", "receiptPrintLogs", "pos"],
      queries,
      subQueries,
      orderBy: [
        { entityField: "createdDate", orderType: "DESC" },
        // {
        //   entityField: "printedDatetime",
        //   orderType: "ASC",
        //   alias: "receiptPrintLogs"
        // },
      ],
    }),
    paging,
    getEmptyList,
  ])
  .post(
    posAuth,
    OfficeController.officeVerifyAccount,
    OfficeController.officePayment,
    ct.createReceipt,
    onSuccess()
  );

receiptRouter
  .route("/:id/cancel")
  .put(
    posAuth,
    isPosManager,
    OfficeController.officeCancel,
    ct.cancelReceipt,
    ct.getReceipt,
    onSuccess()
  );

receiptRouter
  .route("/:id/printlogs")
  .post(posAuth, rplCt.createReceiptPringLog, onSuccess());

receiptRouter
  .route("/:id/reprint")
  .post(posAuth, isPosManager, rplCt.createReceiptPringLog, onSuccess());

receiptRouter.get("/printReport1", ctReport.printReport1);
receiptRouter.get("/printReport2", ctReport.printReport2);
receiptRouter.get("/printReport3", ctReport.printReport3);
receiptRouter.get("/printReport5", ctReport.printReport5);
receiptRouter.get("/printReport4", ctReport.printReport4);

receiptRouter
  .route("/:id")
  .get(ct.getReceipt, onSuccess())
  .post(posAuth, isPosManager, onSuccess())
  .put(posAuth, updateReceipt, ct.getReceipt, onSuccess());

receiptRouter.get("/printReport1", ctReport.printReport1);

receiptRouter.post("/donations", [ct.create, onSuccess()]);
