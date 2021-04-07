import { Router } from "express";
import * as multer from "multer";

import { ReportController } from "../../../controllers/v1/report_controller";
import { controller as ct } from "../../../controllers/v2/RequestController";
import { controller as itemCtl } from "../../../controllers/v2/RequestItemController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";
import { getStorage } from "../../../utils/multer-helper";

const storage = getStorage("requests");
const upload = multer({ storage });

export const queries: IQuery[] = [
  {
    operator: "like",
    entityField: "documentNumber",
    queryField: "documentNumber"
  },
  {
    operator: "in",
    entityField: "organizationId",
    queryField: "permittedOrganizationIds"
  },
  {
    operator: "=",
    entityField: "status",
    queryField: "status"
  },
  { operator: "=", entityField: "requestType", queryField: "requestType" },
  {
    operator: "like",
    entityField: "name",
    queryField: "name"
  },
  {
    operator: ">=",
    entityField: "documentDate",
    queryField: "startDate"
  },
  {
    operator: "<=",
    entityField: "documentDate",
    queryField: "endDate"
  },
  {
    operator: "=",
    entityField: "fiscalYear",
    queryField: "fiscalYear"
  }
];
const subQueries: ISubQuery[] = [
  {
    operator: "in",
    entityField: "id",
    subEntityClass: "RequestItem",
    alias: "requestItem",
    subEntityField: "requestId",
    queries: [
      {
        operator: "like",
        entityField: "borrower.idCardNo",
        queryField: "idCardNo"
      },
      {
        operator: "like",
        entityField: "borrower.firstname",
        queryField: "firstname"
      },
      {
        operator: "like",
        entityField: "borrower.lastname",
        queryField: "lastname"
      }
    ]
  }
];

// use multiple times
const getRequest = ct.getOne({
  relations: [
    "requestItems",
    "budgetAllocationItems",
    "factSheet",
    "organization"
  ],
  joins: [
    {
      type: "leftJoinAndMapMany",
      mapToField: "attachedFiles",
      mapEntityAlias: "factSheet",
      joinEntityClass: "AttachedFile",
      joinEntityAlias: "attachedFile5",
      conditions: [
        {
          joinFieldToMap: "refId",
          operator: "=",
          entityFieldToMap: "id",
          alias: "factSheet"
        },
        {
          joinFieldToMap: "refType",
          operator: "=",
          queryField: "refType5",
          value: "FACTSHEET.ATTACHEDFILE"
        }
      ]
    }
  ]
});

export const requestRouter = Router();

requestRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({
      selectedFields: [
        "id",
        "documentNumber",
        "requestType",
        "name",
        "documentDate",
        "status"
      ],
      relations: ["organization"],
      orderBy: [
        { entityField: "documentDate", orderType: "DESC" },
        { entityField: "documentNumber", orderType: "DESC" }
      ],
      queries,
      subQueries
    }),
    paging,
    getEmptyList
  ])
  .post(ct.create, onSuccess());

requestRouter.get("/showAllRequests", ct.showAllRequests);

requestRouter.get(
  "/printPersonalRequestReport",
  ct.printPersonalRequestReportReport
);

requestRouter.get(
  "/printDisqualifyPersonalRequestReport",
  ct.printDisqualifyPersonalRequestReport
);

requestRouter.get(
  "/printIncompletePersonalRequestReport",
  ct.printIncompletePersonalRequestReport
);
requestRouter.get("/printCommitteeResultReport", ct.printCommitteeResultReport);

requestRouter.get(
  "/printPersonalRequestSummaryReport",
  ct.printPersonalRequestSummaryReport
);

requestRouter.get("/printResultSummaryReport", ct.printResultSummaryReport);

requestRouter.get("/printRequestResultReport", ct.printRequestResultReport);

requestRouter.get("/printOperationReport", ct.printOperationReport);

requestRouter
  .route("/:id")
  .get(getRequest, onSuccess())
  .put(
    ct.update({
      relations: [
        "requestItems",
        "budgetAllocationItems",
        "factSheet",
        "organization"
      ],
      o2ms: [
        { entityField: "requestItems", entityClass: "RequestItem" },
        {
          entityField: "budgetAllocationItems",
          entityClass: "BudgetAllocationItem"
        }
      ]
    }),
    getRequest,
    onSuccess()
  )
  .delete(ct.delete, onSuccess());

requestRouter.put("/:id/factsheet", [
  upload.any(),
  mapFiles,
  ct.updateFiles(),
  getRequest,
  onSuccess()
]);

requestRouter.get("/:id/print_form", ReportController.createRequestReport);

requestRouter.get(
  "/:id/print_agreement_example",
  ReportController.createAgreementExampleReport
);
requestRouter.get(
  "/:id/print_guarantee_example",
  ReportController.createGuaranteeExampleReport
);
requestRouter.post(
  "/print_request_committee",
  ReportController.createRequestCommitee
);

requestRouter.post("/verify_borrower", ct.verifyBorrower);
requestRouter.post("/verify_guarantor", ct.verifyGuarantor);

requestRouter.get("/:id/request_report", ReportController.createRequestReport);

requestRouter
  .route("/:id/request_items/:subId/attachedfiles")
  .get(itemCtl.getRequestItemWithAllAttachedFiles, onSuccess());

requestRouter.put("/:id/request_items/:subId/:resource", [
  upload.any(),
  mapFiles,
  ct.updateFiles(),
  itemCtl.getRequestItemWithAttachedFiles,
  onSuccess()
]);
