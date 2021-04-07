import { Router } from "express";

import { ReportController } from "../../../controllers/v1/report_controller";
import { controller as ct } from "../../../controllers/v2/GuaranteeController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";

const queries: IQuery[] = [
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
  {
    operator: "like",
    entityField: "guaranteeType",
    queryField: "guaranteeType"
  },
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
  },
  {
    operator: "not in",
    entityField: "status",
    queryField: "statusExcludeList"
  }
];
const subQueries: ISubQuery[] = [
  {
    operator: "in",
    entityField: "id",
    subEntityClass: "GuaranteeItem",
    alias: "guaranteeItem",
    subEntityField: "guaranteeId",
    queries: [
      {
        operator: "like",
        entityField: "guarantor.idCardNo",
        queryField: "idCardNo"
      },
      {
        operator: "like",
        entityField: "guarantor.firstname",
        queryField: "firstname"
      },
      {
        operator: "like",
        entityField: "guarantor.lastname",
        queryField: "lastname"
      }
    ]
  }
];

export const guaranteeRouter = Router();

guaranteeRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({
      selectedFields: [
        "id",
        "documentNumber",
        "guaranteeType",
        "name",
        "loanAmount",
        "documentDate",
        "status",
        "endDate"
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

guaranteeRouter
  .route("/:id")
  .get(
    ct.getOne({
      relations: ["organization", "guaranteeItems", "agreement", "request"]
    }),
    onSuccess()
  )
  .put(
    // ct.update({
    //   relations: ["organization", "guaranteeItems"],
    //   o2ms: [{ entityField: "guaranteeItems", entityClass: "GuaranteeItem" }]
    // }),
    ct.updateGuarantee,
    onSuccess()
  )
  .delete(ct.delete, onSuccess());

guaranteeRouter.get(
  "/:id/print_guarantee",
  ReportController.createGuaranteeReport
);
