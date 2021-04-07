import { Router } from "express";
import * as multer from "multer";

import { controller as ct } from "../../../controllers/v2/DonationAllowanceController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { mapFiles } from "../../../middlewares/mapfile";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";
import { fileFilter, getStorage } from "../../../utils/multer-helper";

const storageXlsx = getStorage("donation_allowances", { withDate: true });
const uploadXlsx = multer({
  storage: storageXlsx,
  fileFilter: fileFilter("xlsx"),
});
const donationAllowanceFile = [{ name: "donation_allowance", maxCount: 1 }];

const storage = getStorage("donation_allowances");
const upload = multer({ storage });

export const donationAllowanceRouter = Router();

export const queries: IQuery[] = [
  {
    operator: "like",
    entityField: "donatorIdCardNo",
    queryField: "filterSponsorIdCardNo",
  },
  {
    operator: "in",
    entityField: "organizationId",
    queryField: "permittedOrganizationIds",
  },
  {
    operator: "like",
    entityField: "donatorFirstname",
    queryField: "filterSponsorFirstname",
  },
  {
    operator: "like",
    entityField: "donatorLastname",
    queryField: "filterSponsorLastname",
  },
  {
    operator: "like",
    entityField: "receiptOrganization",
    queryField: "filterOrgName",
  },
  {
    operator: ">=",
    entityField: "receiptDate",
    queryField: "filterStartDate",
  },
  {
    operator: "<=",
    entityField: "receiptDate",
    queryField: "filterEndDate",
  },
];
export const subQueries: ISubQuery[] = [
  {
    operator: "in",
    entityField: "receiptId",
    subEntityClass: "Receipt",
    alias: "receipt",
    subEntityField: "id",
    queries: [
      {
        operator: "like",
        entityField: "documentNumber",
        queryField: "filterDocumentNumber",
      },
    ],
  },
];
donationAllowanceRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({
      selectedFields: [],
      relations: [
        "organization",
        "pos",
        "receipt",
        "receipt.receiptPrintLogs",
        "receipt.receiptItems",
        "receipt.posShift",
        "receipt.posShift.onDutymanager",
        "receipt.posShift.currentCashier",
      ],
      orderBy: [
        { entityField: "donationDate", orderType: "DESC" },
        // { entityField: "documentNumber", orderType: "DESC" },
      ],
      queries,
      subQueries,
    }),
    paging,
    getEmptyList,
  ])
  .post(ct.create, onSuccess());

donationAllowanceRouter.post(
  "/:id/receipts",
  ct.createReceiptByDonationId,
  ct.getOne({
    relations: [
      "organization",
      "pos",
      "pos.receiptSequence",
      "pos.manager",
      "receipt",
      "receipt.receiptPrintLogs",
      "receipt.receiptItems",
      "receipt.posShift",
      "receipt.posShift.onDutymanager",
      "receipt.posShift.currentCashier",
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
            value: "DONATIONALLOWANCE.ATTACHEDFILE",
          },
        ],
      },
    ],
  }),
  onSuccess()
);
donationAllowanceRouter.post(
  "/print_thankyou_letters",
  ct.printThankyouLetters,
  onSuccess()
);
donationAllowanceRouter.post("/print_envelops", ct.printEnvelops, onSuccess());
donationAllowanceRouter
  .route("/fileupload")
  .post(
    uploadXlsx.fields([...donationAllowanceFile]),
    ct.createManyFromFile,
    onSuccess()
  );

donationAllowanceRouter
  .route("/:id")
  .get(
    ct.getOne({
      relations: [
        "organization",
        "pos",
        "pos.receiptSequence",
        "receipt",
        "receipt.receiptPrintLogs",
        "receipt.receiptItems",
        "receipt.posShift",
        "receipt.posShift.onDutymanager",
        "receipt.posShift.currentCashier",
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
              value: "DONATIONALLOWANCE.ATTACHEDFILE",
            },
          ],
        },
      ],
    }),
    onSuccess()
  )
  .put([
    upload.any(),
    mapFiles,
    ct.update({ withFiles: true }),
    ct.getOne({
      relations: [
        "organization",
        "pos",
        "pos.receiptSequence",
        "receipt",
        "receipt.receiptPrintLogs",
        "receipt.receiptItems",
        "receipt.posShift",
        "receipt.posShift.onDutymanager",
        "receipt.posShift.currentCashier",
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
              value: "DONATIONALLOWANCE.ATTACHEDFILE",
            },
          ],
        },
      ],
    }),
    onSuccess(),
  ])
  .delete(ct.delete, onSuccess());
