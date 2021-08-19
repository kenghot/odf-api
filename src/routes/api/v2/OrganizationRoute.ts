import { Router } from "express";
import * as multer from "multer";

import { controller as ct } from "../../../controllers/v2/OrganizationController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";
import { getStorage } from "../../../utils/multer-helper";

const storage = getStorage("organizations");
const upload = multer({ storage });

const queries: IQuery[] = [
  {
    operator: "like",
    entityField: "orgName",
    queryField: "orgName",
  },
  {
    operator: "=",
    entityField: "address.provinceCode",
    queryField: "provinceCode",
  },
  {
    operator: "=",
    entityField: "parent",
    queryField: "parentId",
  },
  { operator: "=", entityField: "active", queryField: "active" },
  { operator: "=", entityField: "orgCode", queryField: "orgCode" },
  {
    operator: "in",
    entityField: "id",
    queryField: "permittedOrganizationIds",
  },
];
const subQueries: ISubQuery[] = [];

export const organizationRouter = Router();

organizationRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({ relations: ["parent"], queries, subQueries }),
    paging,
    getEmptyList,
  ])
  .post(ct.create, onSuccess());

organizationRouter.put("/:id/donation_authorization", [
  upload.any(),
  mapFiles,
  ct.update({
    relations: ["parent"],
    withFiles: true,
  }),
  ct.getOne({
    relations: [
      "requestSequence",
      "requestOnlineSequence",
      "agreementSequence",
      "guaranteeSequence",
      "voucherSequence",
      "parent",
    ],
    joins: [
      {
        type: "leftJoinAndMapMany",
        mapToField: "attachedFiles",
        joinEntityClass: "AttachedFile",
        joinEntityAlias: "attachedFile",
        conditions: [
          { joinFieldToMap: "refId", operator: "=", entityFieldToMap: "id" },
          {
            joinFieldToMap: "refType",
            operator: "=",
            queryField: "refType",
            value: "SIGNATURE.ATTACHEDFILE",
          },
        ],
      },
    ],
  }),

  onSuccess(),
]);
organizationRouter
  .route("/:id")
  .get(
    ct.getOne({
      relations: [
        "requestSequence",
        "requestOnlineSequence",
        "agreementSequence",
        "guaranteeSequence",
        "voucherSequence",
        "parent",
      ],
      joins: [
        {
          type: "leftJoinAndMapMany",
          mapToField: "attachedFiles",
          joinEntityClass: "AttachedFile",
          joinEntityAlias: "attachedFile",
          conditions: [
            { joinFieldToMap: "refId", operator: "=", entityFieldToMap: "id" },
            {
              joinFieldToMap: "refType",
              operator: "=",
              queryField: "refType",
              value: "SIGNATURE.ATTACHEDFILE",
            },
          ],
        },
      ],
    }),
    onSuccess()
  )
  .put(
    ct.update({
      relations: ["parent"],
    }),
    onSuccess()
  )
  .delete(ct.delete, onSuccess());
