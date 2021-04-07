import { Router } from "express";

import multer = require("multer");
import { controller as ct } from "../../../controllers/v2/ReceiptControlLogController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { isPosManager } from "../../../middlewares/pos";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";
import { getStorage } from "../../../utils/multer-helper";

const queries: IQuery[] = [
  {
    operator: "=",
    entityField: "status",
    queryField: "status"
  },
  {
    operator: "=",
    entityField: "logType",
    queryField: "logType"
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
  }
];

export const subQueries: ISubQuery[] = [
  {
    operator: "in",
    entityField: "posId",
    subEntityClass: "Pos",
    alias: "pos",
    subEntityField: "id", // selectedField from subEntityClass
    queries: [
      {
        operator: "in",
        entityField: "organizationId",
        queryField: "permittedOrganizationIds"
      }
    ]
  }
];

const storage = getStorage("receiptControlLog");
const upload = multer({ storage });

export const receiptControlRouter = Router();

receiptControlRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({
      relations: ["pos", "pos.organization", "user", "onDutymanager"],
      joins: [
        {
          type: "leftJoinAndMapMany",
          mapToField: "requestAttachedFiles",
          joinEntityClass: "AttachedFile",
          joinEntityAlias: "attachedFile1",
          conditions: [
            { joinFieldToMap: "refId", operator: "=", entityFieldToMap: "id" },
            {
              joinFieldToMap: "refType",
              operator: "=",
              queryField: "refType1",
              value: "RECEIPT.REQUEST"
            }
          ]
        },
        {
          type: "leftJoinAndMapMany",
          mapToField: "approveAttachedFiles",
          joinEntityClass: "AttachedFile",
          joinEntityAlias: "attachedFile2",
          conditions: [
            { joinFieldToMap: "refId", operator: "=", entityFieldToMap: "id" },
            {
              joinFieldToMap: "refType",
              operator: "=",
              queryField: "refType2",
              value: "RECEIPT.APPROVE"
            }
          ]
        }
      ],
      queries,
      subQueries,
      orderBy: [{ entityField: "documentDate", orderType: "DESC" }]
    }),
    paging,
    getEmptyList
  ])
  .post(
    upload.any(),
    mapFiles,
    isPosManager,
    ct.createReceiptControlLog,
    ct.getReceiptControllerLog,
    onSuccess()
  );

receiptControlRouter
  .route("/:id")
  .get(ct.getReceiptControllerLog, onSuccess())
  .put(
    upload.any(),
    mapFiles,
    ct.updateReceiptControlLog,
    ct.getReceiptControllerLog,
    onSuccess()
  )
  .delete(ct.deleteLog);
