import { Router } from "express";

import { ReportController } from "../../../controllers/v1/report_controller";
import { controller as ct } from "../../../controllers/v2/AgreementController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";

export const queries: IQuery[] = [
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
    operator: "like",
    entityField: "agreementType",
    queryField: "agreementType",
  },
  {
    operator: "like",
    entityField: "name",
    queryField: "name",
  },
  {
    operator: ">=",
    entityField: "documentDate",
    queryField: "startDate",
  },
  {
    operator: "<=",
    entityField: "documentDate",
    queryField: "endDate",
  },
  {
    operator: "=",
    entityField: "fiscalYear",
    queryField: "fiscalYear",
  },
  {
    operator: "not in",
    entityField: "status",
    queryField: "statusExcludeList",
  },
];
export const subQueries: ISubQuery[] = [
  {
    operator: "in",
    entityField: "id",
    subEntityClass: "AgreementItem",
    alias: "agreementItem",
    subEntityField: "agreementId",
    queries: [
      {
        operator: "like",
        entityField: "borrower.idCardNo",
        queryField: "idCardNo",
      },
      {
        operator: "like",
        entityField: "borrower.firstname",
        queryField: "firstname",
      },
      {
        operator: "like",
        entityField: "borrower.lastname",
        queryField: "lastname",
      },
      {
        operator: "like",
        entityField: "guarantor.idCardNo",
        queryField: "guarantorIdCardNo",
      },
      {
        operator: "like",
        entityField: "guarantor.firstname",
        queryField: "guarantorFirstname",
      },
      {
        operator: "like",
        entityField: "guarantor.lastname",
        queryField: "guarantorLastname",
      },
    ],
  },
];
// use multiple times
const getAgreement= ct.getOne({
  relations: [
    "agreementItems"
  ]
});
export const agreementRouter = Router();

agreementRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({
      selectedFields: [
        "id",
        "documentNumber",
        "agreementType",
        "name",
        "documentDate",
        "loanAmount",
        "status",
        "endDate",
      ],
      relations: ["organization", "request"],
      orderBy: [
        { entityField: "documentDate", orderType: "DESC" },
        { entityField: "documentNumber", orderType: "DESC" },
      ],
      queries,
      subQueries,
    }),
    paging,
    getEmptyList,
  ])
  .post(ct.create, onSuccess());

agreementRouter
  .route("/:id")
  .get(
    ct.getOne({
      relations: ["organization", "agreementItems", "guarantee", "request"],
    }),
    onSuccess()
  )
  .put(
    ct.validateUpdateAgreement,
    // ct.update({
    //   relations: ["organization", "agreementItems"],
    //   o2ms: [{ entityField: "agreementItems", entityClass: "AgreementItem" }]
    // }),
    ct.updateAgreement,
    onSuccess()
  )
  .delete(ct.delete, onSuccess());

agreementRouter.route("/requests").post(ct.createMany);

agreementRouter.get(
  "/:id/print_agreement",
  ReportController.createAgreementReport
);
