import { Router } from "express";
import * as multer from "multer";

import { controller as ct } from "../../../controllers/v2/DonationDirectController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";
import { fileFilter, getStorage } from "../../../utils/multer-helper";

const storage = getStorage("donation_direct", { withDate: true });
const upload = multer({ storage, fileFilter: fileFilter("xlsx") });
const donationDirectFile = [{ name: "donation_allowance", maxCount: 1 }];

export const donationDirectRouter = Router();

export const queries: IQuery[] = [
  {
    operator: "like",
    entityField: "donatorIdCardNo",
    queryField: "filterSponsorIdCardNo",
  },
  {
    operator: "like",
    entityField: "name",
    queryField: "filterOrgName",
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
donationDirectRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.getMany({
      selectedFields: [],
      relations: [
        "organization",
        "receipt",
        "receipt.receiptPrintLogs",
        "receipt.receiptItems",
        "receipt.pos",
        "receipt.posShift",
        "receipt.posShift.onDutymanager",
        "receipt.posShift.currentCashier",
      ],
      orderBy: [
        { entityField: "receiptDate", orderType: "DESC" },
        // { entityField: "documentNumber", orderType: "DESC" },
      ],
      queries,
      subQueries,
    }),
    paging,
    getEmptyList,
  ])
  .post(ct.create, onSuccess());

donationDirectRouter.post(
  "/:id/receipts",
  ct.createReceiptByDonationId,
  ct.getOne(),
  onSuccess()
);
donationDirectRouter.post(
  "/generate_e_donation",
  ct.generateEDonation,
  onSuccess()
);
donationDirectRouter.post(
  "/print_thankyou_letters",
  ct.printThankyouLetters,
  onSuccess()
);
donationDirectRouter
  .route("/fileupload")
  .post(
    upload.fields([...donationDirectFile]),
    ct.createManyFromFile,
    onSuccess()
  );

donationDirectRouter
  .route("/:id")
  .get(
    ct.getOne({
      relations: [
        "organization",
        "receipt",
        "receipt.receiptPrintLogs",
        "receipt.receiptItems",
        "receipt.pos",
        "receipt.posShift",
        "receipt.posShift.onDutymanager",
        "receipt.posShift.currentCashier",
      ],
    }),
    onSuccess()
  )
  .put(
    ct.update(),
    ct.getOne({
      relations: [
        "organization",
        "receipt",
        "receipt.receiptPrintLogs",
        "receipt.receiptItems",
        "receipt.pos",
        "receipt.posShift",
        "receipt.posShift.onDutymanager",
        "receipt.posShift.currentCashier",
      ],
    }),
    onSuccess()
  )
  .delete(ct.delete, onSuccess());
