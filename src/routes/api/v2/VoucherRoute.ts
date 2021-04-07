import { Router } from "express";
import * as multer from "multer";

import { controller as ct } from "../../../controllers/v2/VoucherController";
import { filterByOrganization } from "../../../middlewares/filter";
import { getEmptyList } from "../../../middlewares/get-empty-list";
import { paging } from "../../../middlewares/paging";
import { onSuccess } from "../../../middlewares/success-handler";
import { IQuery, ISubQuery } from "../../../repositories/v2/SearchRepository";
import { fileFilter, getStorage } from "../../../utils/multer-helper";

const storage = getStorage("vouchers", { withDate: true });
const upload = multer({ storage, fileFilter: fileFilter("txt") });

const ktbFile = [{ name: "ktb", maxCount: 1 }];

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
    operator: "=",
    entityField: "refType",
    queryField: "refType"
  },
  {
    operator: "in",
    entityField: "refId",
    queryField: "refId"
  }
];
const subQueries: ISubQuery[] = [
  {
    operator: "in",
    entityField: "refId",
    subEntityClass: "Agreement",
    alias: "agreement",
    subEntityField: "id", // selectedField from subEntityClass
    join: "leftJoin", // for advance queries from subEntityClass
    joinAlias: "agreementItem", // alias of joinField that can use in queries as alias
    joinField: "agreementItems", // field on subEntityClass that want to query
    queries: [
      {
        operator: "like",
        entityField: "documentNumber",
        queryField: "refDocumentNumber"
      },
      {
        operator: "like",
        entityField: "borrower.idCardNo",
        queryField: "idCardNo",
        alias: "agreementItem"
      },
      {
        operator: "like",
        entityField: "borrower.firstname",
        queryField: "firstname",
        alias: "agreementItem"
      },
      {
        operator: "like",
        entityField: "borrower.lastname",
        queryField: "lastname",
        alias: "agreementItem"
      }
    ]
  }
];

const getVoucher = ct.getOne({
  relations: ["organization", "voucherItems"]
});

export const voucherRouter = Router();

voucherRouter
  .route("/")
  .get([
    filterByOrganization,
    ct.setVoucherParams,
    ct.getMany({
      relations: ["organization"],
      joins: [
        {
          type: "leftJoinAndMapOne",
          mapToField: "refDocument",
          joinEntityClass: "Agreement",
          joinEntityAlias: "agreement",
          conditions: [
            { joinFieldToMap: "id", operator: "=", entityFieldToMap: "refId" }
          ]
        }
      ],
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

voucherRouter
  .route("/ktb")
  .post(ct.createKTBFile)
  .put([upload.fields([...ktbFile]), ct.updateVoucherByKTBFile]);

voucherRouter
  .route("/:id")
  .get(getVoucher)
  .put(
    ct.update({
      relations: ["organization", "voucherItems"],
      o2ms: [{ entityField: "voucherItems", entityClass: "VoucherItem" }]
    }),
    getVoucher,
    onSuccess()
  )
  .delete(ct.delete, onSuccess());

voucherRouter.route("/agreements").post(ct.createMany);

voucherRouter.get("/:id/print_receipt", ct.generateVoucherReceipt);
