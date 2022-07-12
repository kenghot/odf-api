import moment = require("moment");
import { DeepPartial, getRepository, Brackets } from "typeorm";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { EmbeddedDebtAcknowledgement } from "../../entities/embedded/EmbeddedDebtAcknowledgement";
import { receiptStatusSet } from "../../enumset";
import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import { getFiscalYear, getThaiPartialDate } from "../../utils/datetime-helper";
import { getEnumSetList, IItemSet } from "../../utils/get-enum-set-text";
import { flattenObject } from "../../utils/object-helper";
import { addSelectRegion } from "../queries-utils/organization-queries";
import { BaseController } from "./BaseController";
import { ReceiptItem } from "../../entities/ReceiptItem";
import { Receipt } from "../../entities/Receipt";
import { Agreement } from "../../entities/Agreement";
import { Voucher } from "../../entities/Voucher";

interface IOnAcknowledge {
  debtAcknowledgement: EmbeddedDebtAcknowledgement;
  accountReceivable: AccountReceivable;
  createdBy: number;
  createdByName: string;
}
interface IUAcknowledge {
  debtAcknowledgement: EmbeddedDebtAcknowledgement;
  updatedBy: number;
  updatedByName: string;
}

const paymentName = {
  ["AR"]: "ชำระคืนเงินกู้ยืมฯ",
  ["PR"]: "ชำระคืนเงินเหลือจ่ายจากการดำเนินโครงการ",
  ["LR"]: "รับคืนเงินจากลูกหนี้เงินยืม",
  ["FR"]: "รับคืนค่าธรรมเนียมความแพ่ง",
  ["D"]: "เงินบริจาคสำหรับโครงการบริจาคเบี้ยยังชีพผู้สูงอายุเข้ากองทุนผู้สูงอายุ",
  ["O"]: "อื่นๆ",
};
const months = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

class ReceiptReportController extends BaseController {
  private reportNotFoundMessage =
    "ไม่พบข้อมูลสำหรับออกรายงาน กรุณาเลือกเงื่อนไขใหม่";

  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  printReport1 = async (req, res, next) => {
    const startPaidDateParam = req.query.startPaidDate;
    const endPaidDateParam = req.query.endPaidDate;
    const posRefType = req.query.posRefType;
    const organizationIdParam = req.query.organizationId;

    let data: any;
    let reportQuery: any;

    if (!organizationIdParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกหน่วยงาน",
        })
      );
    }
    if (!posRefType) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกรูปแบบการชำระ",
        })
      );
    }
    if (!startPaidDateParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกช่วงวันที่ชำระเงิน",
        })
      );
    }
    if (!endPaidDateParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกช่วงวันที่ชำระเงิน",
        })
      );
    }

    if (posRefType === "AR") {
      reportQuery = getRepository(AccountReceivableTransaction)
        // const reportQuery = getRepository(ReceiptItem)

        .createQueryBuilder("accTrans")
        // .createQueryBuilder("receiptItems")
        .leftJoin("accTrans.accountReceivable", "accountReceivable")
        // .leftJoin(AccountReceivable, "accountReceivable")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("accountReceivable.organization", "organization")
        // .leftJoin(
        //   ReceiptItem,
        //   "item",
        //   "item.refType = 'AR' AND item.refId = accountReceivable.id"
        // )
        .leftJoin(Receipt, "receipt", "receipt.documentNumber= accTrans.paymentReferenceNo")
        .select("organization.orgName", "orgName")
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect("accTrans.paidDate", "paidDate")
        .addSelect("accTrans.paidAmount", "paidAmount")
        .addSelect("accTrans.paymentType", "paymentType")
        .addSelect("accTrans.paymentMethod", "paymentMethod")
        .addSelect("accTrans.paymentReferenceNo", "paymentReferenceNo")
        .addSelect("accTrans.createdByName", "createdByName")
        // .addSelect("agreement.documentNumber", "documentNumber")
        // .addSelect("receipt.clientName", "paidByName")
        .addSelect("accountReceivable.name", "paidByName")
        // .addSelect("receipt.documentNote", "documentNote")
        .addSelect(
          `CASE  
          WHEN accTrans.outstandingDebtBalance = 0.00 AND accountReceivable.status = "11" THEN CONCAT('ปิดบัญชี: ', accountReceivable.comments)
          WHEN accTrans.outstandingDebtBalance = 0.00 AND accountReceivable.status = "33" THEN CONCAT('ปิดบัญชี เนื่องจากตัดเป็นหนี้สูญ: ', accountReceivable.comments)
          ELSE receipt.documentNote
          END`,
          "documentNote"
        )
        // .addSelect(
        //   `CASE  
        //   WHEN accTrans.paymentType = 'CS' THEN 'C.S'
        //   WHEN accTrans.paymentType = 'OFFICE' THEN 'OFFICE'
        //   ELSE accTrans.paymentType 
        //   END`,
        //   "cs"
        // )
        // .addSelect("accTrans.paymentType", "")
        .addSelect(
          "IF(accTrans.paymentType = 'CS', accTrans.paidAmount, '')",
          "cs"
        )
        .addSelect(
          "IF((receipt.paymentMethod = 'CASH' OR accTrans.paymentMethod ='CASH')AND accTrans.paymentType != 'CS', accTrans.paidAmount, '')",
          "cash"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'MONEYORDER' OR accTrans.paymentMethod ='MONEYORDER', accTrans.paidAmount, '')",
          "moneyOrder"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'CHECK' OR accTrans.paymentMethod ='CHECK', accTrans.paidAmount, '')",
          "check"
        )
        .addSelect(
          "IF(accTrans.paymentType = 'KTB', accTrans.paidAmount, '')",
          "ktb"
        )
        .addSelect(
          "IF((receipt.paymentMethod = 'TRANSFER' OR accTrans.paymentMethod ='TRANSFER') AND accTrans.paymentType != 'KTB' AND accTrans.paymentType != 'CS', accTrans.paidAmount, '')",
          "transfer" 
        )
        .addSelect(
          "IF(accTrans.paymentMethod NOT IN ('CASH','MONEYORDER', 'CHECK','TRANSFER')  AND accTrans.paymentType != 'KTB', accTrans.paidAmount, '')",
          "other"
        );
      // .addSelect("item.name");
      if (startPaidDateParam && endPaidDateParam) {
        reportQuery.andWhere(
          "accTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate ",
          {
            startDocumentDate: startPaidDateParam,
            endDocumentDate: endPaidDateParam,
          }
        );
      }
      if (organizationIdParam) {
        reportQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }
      reportQuery.orderBy("accTrans.paidDate");
    }
    else {
      reportQuery = getRepository(ReceiptItem)
        .createQueryBuilder("item")
        .leftJoin("item.receipt", "receipt")
        .leftJoin("receipt.organization", "organization")
        .select("organization.orgName", "orgName")
        .addSelect("receipt.paidDate", "paidDate")
        .addSelect("item.subtotal", "paidAmount")
        .addSelect("receipt.clientName", "paidByName")
        // .addSelect("accTrans.paymentType", "paymentType")
        .addSelect("receipt.paymentMethod", "paymentMethod")
        .addSelect("receipt.documentNumber", "paymentReferenceNo")
        .addSelect("receipt.createdByName", "createdByName")
        .addSelect("receipt.documentNote", "documentNote")
        // .addSelect("IF(receipt.paymentType = 'CS', 'x', '')", "cs")
        .addSelect(
          "IF(receipt.paymentMethod = 'TRANSFER', item.subtotal, '')",
          "transfer"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'CASH', item.subtotal, '')",
          "cash"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'MONEYORDER', item.subtotal, '')",
          "moneyOrder"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'CHECK', item.subtotal, '')",
          "check"
        );
      // .addSelect("IF(accTrans.paymentType = 'KTB', 'x', '')", "ktb")
      // .addSelect("IF(accTrans.paymentType = 'TRANSFER', 'x', '')", "transfer")
      // .addSelect("item.name");
      if (startPaidDateParam && endPaidDateParam) {
        reportQuery.andWhere(
          "receipt.paidDate BETWEEN :startDocumentDate AND :endDocumentDate + INTERVAL 1 DAY",
          {
            startDocumentDate: startPaidDateParam,
            endDocumentDate: endPaidDateParam,
          }
        );
      }
      if (organizationIdParam) {
        reportQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }
      if (posRefType) {
        reportQuery.andWhere("item.refType=:posRefType", {
          posRefType: posRefType,
        });
      }
      reportQuery.orderBy("receipt.paidDate");
    }
    try {
      data = await reportQuery
        // .groupBy("organization.region")
        // .addGroupBy("organization.orgName")
        // .addGroupBy(`accRecTrans.paymentType`)
        .getRawMany();
      // console.log(data.length);
      // console.log(data);

      // return res.json({ data: "test" });
      if (!data || data.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานการรับเงินประจำวัน ประเภท ${paymentName[posRefType]}`,
          // title2: `ประจำปีงบประมาณ ${fiscalYearParam || ""}`,
          // fiscalYear: fiscalYearParam || "-",
          title2: `ระหว่าง ${
            startPaidDateParam && endPaidDateParam
              ? getThaiPartialDate(startPaidDateParam) +
                " - " +
                getThaiPartialDate(endPaidDateParam) +
                data[0].orgName
              : "-"
          }`,
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          // reportDataDate2: `รายงาน ณ วันที่ ${getThaiPartialDate(
          //   moment().format()
          // )}`,
          data: data,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT1-acc-xlsx" },
          data: templateData,
        });

        const reportName = `ReceiptReport1${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
  printReport2 = async (req, res, next) => {
    const posRefType = req.query.posRefType;
    const organizationIdParam = req.query.organizationId;
    const fiscalYearParam = req.query.fiscalYear;
    const monthParam = req.query.month;

    const year = +fiscalYearParam - 543;
    const firstDate = `${year}-${monthParam}-01`;

    let data: any;
    let reportQuery: any;

    if (!organizationIdParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกหน่วยงาน",
        })
      );
    }
    if (!posRefType) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกรูปแบบการชำระ",
        })
      );
    }
    if (!fiscalYearParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกปี",
        })
      );
    }
    if (!monthParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกเดือน",
        })
      );
    }

    if (posRefType === "AR") {
      reportQuery = getRepository(AccountReceivableTransaction)
        // const reportQuery = getRepository(ReceiptItem)

        .createQueryBuilder("accTrans")
        // .createQueryBuilder("receiptItems")
        .leftJoin("accTrans.accountReceivable", "accountReceivable")
        // .leftJoin(AccountReceivable, "accountReceivable")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("accountReceivable.organization", "organization")
        // .leftJoin(
        //   ReceiptItem,
        //   "item",
        //   "item.refType = 'AR' AND item.refId = accountReceivable.id"
        // )
        .leftJoin(Receipt, "receipt", "receipt.documentNumber= accTrans.paymentReferenceNo")
        .select("organization.orgName", "orgName")
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect("accTrans.paidDate", "paidDate")
        .addSelect("accTrans.paidAmount", "paidAmount")
        .addSelect("accTrans.paymentType", "paymentType")
        .addSelect("accTrans.paymentMethod", "paymentMethod")
        .addSelect("accTrans.paymentReferenceNo", "paymentReferenceNo")
        .addSelect("accTrans.createdByName", "createdByName")
        // .addSelect("agreement.documentNumber", "documentNumber")
        // .addSelect("receipt.clientName", "paidByName")
        .addSelect("accountReceivable.name", "paidByName")
        // .addSelect("receipt.documentNote", "documentNote")
        .addSelect(
          `CASE  
          WHEN accTrans.outstandingDebtBalance = 0.00 AND accountReceivable.status = "11" THEN CONCAT('ปิดบัญชี: ', accountReceivable.comments)
          WHEN accTrans.outstandingDebtBalance = 0.00 AND accountReceivable.status = "33" THEN CONCAT('ปิดบัญชี เนื่องจากตัดเป็นหนี้สูญ: ', accountReceivable.comments)
          ELSE receipt.documentNote
          END`,
          "documentNote"
        )
        // .addSelect(
        //   `CASE  
        //   WHEN accTrans.paymentType = 'CS' THEN 'C.S'
        //   WHEN accTrans.paymentType = 'OFFICE' THEN 'OFFICE'
        //   ELSE accTrans.paymentType 
        //   END`,
        //   "cs"
        // )
        // .addSelect("accTrans.paymentType", "")
        .addSelect(
          "IF(accTrans.paymentType = 'CS', accTrans.paidAmount, '')",
          "cs"
        )
        .addSelect(
          "IF((receipt.paymentMethod = 'CASH' OR accTrans.paymentMethod ='CASH')AND accTrans.paymentType != 'CS', accTrans.paidAmount, '')",
          "cash"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'MONEYORDER' OR accTrans.paymentMethod ='MONEYORDER', accTrans.paidAmount, '')",
          "moneyOrder"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'CHECK' OR accTrans.paymentMethod ='CHECK', accTrans.paidAmount, '')",
          "check"
        )
        .addSelect(
          "IF(accTrans.paymentType = 'KTB', accTrans.paidAmount, '')",
          "ktb"
        )
        .addSelect(
          "IF((receipt.paymentMethod = 'TRANSFER' OR accTrans.paymentMethod ='TRANSFER') AND accTrans.paymentType != 'KTB' AND accTrans.paymentType != 'CS', accTrans.paidAmount, '')",
          "transfer" 
        )
        .addSelect(
          "IF(accTrans.paymentMethod NOT IN ('CASH','MONEYORDER', 'CHECK','TRANSFER')  AND accTrans.paymentType != 'KTB', accTrans.paidAmount, '')",
          "other"
        );
      // .addSelect("item.name");
      // if (startPaidDateParam && endPaidDateParam) {
      //   reportQuery.andWhere(
      //     "accTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
      //     {
      //       startDocumentDate: startPaidDateParam,
      //       endDocumentDate: endPaidDateParam,
      //     }
      //   );
      // }
      reportQuery.andWhere(
        "accTrans.paidDate BETWEEN :startDocumentDate AND LAST_DAY(:endDocumentDate)",
        {
          startDocumentDate: firstDate,
          // endDocumentDate: `LAST_DAY(${firstDate})`,
          endDocumentDate: firstDate+" 23:59:00",
        }
      );
      if (organizationIdParam) {
        reportQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }
      reportQuery.orderBy("accTrans.paidDate");
    } else {
      reportQuery = getRepository(ReceiptItem)
        .createQueryBuilder("item")
        .leftJoin("item.receipt", "receipt")
        .leftJoin("receipt.organization", "organization")
        .select("organization.orgName", "orgName")
        .addSelect("receipt.paidDate", "paidDate")
        .addSelect("item.subtotal", "paidAmount")
        .addSelect("receipt.clientName", "paidByName")
        // .addSelect("accTrans.paymentType", "paymentType")
        .addSelect("receipt.paymentMethod", "paymentMethod")
        .addSelect("receipt.documentNumber", "paymentReferenceNo")
        .addSelect("receipt.createdByName", "createdByName")
        .addSelect("receipt.documentNote", "documentNote")
        // .addSelect("IF(receipt.paymentType = 'CS', 'x', '')", "cs")
        .addSelect(
          "IF(receipt.paymentMethod = 'TRANSFER', item.subtotal, '')",
          "transfer"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'CASH', item.subtotal, '')",
          "cash"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'MONEYORDER', item.subtotal, '')",
          "moneyOrder"
        )
        .addSelect(
          "IF(receipt.paymentMethod = 'CHECK', item.subtotal, '')",
          "check"
        );
      // .addSelect("IF(accTrans.paymentType = 'KTB', 'x', '')", "ktb")
      // .addSelect("IF(accTrans.paymentType = 'TRANSFER', 'x', '')", "transfer")
      // .addSelect("item.name");
      // if (startPaidDateParam && endPaidDateParam) {
      //   reportQuery.andWhere(
      //     "receipt.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
      //     {
      //       startDocumentDate: startPaidDateParam,
      //       endDocumentDate: endPaidDateParam,
      //     }
      //   );
      // }
      reportQuery.andWhere(
        "DATE(receipt.paidDate) BETWEEN :startDocumentDate AND LAST_DAY(:endDocumentDate)",
        {
          startDocumentDate: firstDate,
          endDocumentDate: firstDate+" 23:59:00",
        }
      );
      if (organizationIdParam) {
        reportQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }
      if (posRefType) {
        reportQuery.andWhere("item.refType=:posRefType", {
          posRefType: posRefType,
        });
      }
      reportQuery.orderBy("receipt.paidDate");
    }
    try {
      data = await reportQuery
        // .groupBy("organization.region")
        // .addGroupBy("organization.orgName")
        // .addGroupBy(`accRecTrans.paymentType`)
        .getRawMany();
      // console.log(data.length);
      // console.log(data);

      // return res.json({ data: "test" });
      if (!data || data.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานการรับเงินประจำเดือน ประเภท ${paymentName[posRefType]}`,
          title2: `ประจำเดือน${months[monthParam - 1]} ปีงบประมาณ${
            fiscalYearParam || ""
          } ของหน่วยงาน${data[0].orgName}`,
          // fiscalYear: fiscalYearParam || "-",
          // title2: `ระหว่าง ${
          //   startPaidDateParam && endPaidDateParam
          //     ? getThaiPartialDate(startPaidDateParam) +
          //       " - " +
          //       getThaiPartialDate(endPaidDateParam)
          //     : "-"
          // }`,
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: data,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT1-acc-xlsx" },
          data: templateData,
        });

        const reportName = `ReceiptReport2${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
  printReport3 = async (req, res, next) => {
    const startPaidDateParam = req.query.startPaidDate;
    const endPaidDateParam = req.query.endPaidDate;
    // const posRefType = req.query.posRefType;
    const organizationIdParam = req.query.organizationId;

    let data: any;
    let reportQuery: any;

    if (!organizationIdParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกหน่วยงาน",
        })
      );
    }
    // if (!posRefType) {
    //   return next(
    //     new NotFoundError({
    //       name: "กรุณาเลือกรูปแบบการชำระ",
    //     })
    //   );
    // }
    if (!startPaidDateParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกช่วงวันที่ชำระเงิน",
        })
      );
    }
    if (!endPaidDateParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกช่วงวันที่ชำระเงิน",
        })
      );
    }
    // reportQuery = getRepository(ReceiptItem)
    reportQuery = getRepository(Receipt)
      // .createQueryBuilder("item")
      // .leftJoin("item.receipt", "receipt")
      .createQueryBuilder("receipt")
      // .leftJoin("receipt.receiptItems", "item")
      // .leftJoin("item.receipt", "receipt")
      .leftJoin("receipt.organization", "organization")
      // .leftJoin(
      //   AccountReceivable,
      //   "accountReceivable",
      //   "accountReceivable.id = item.ref2"
      // )
      // .leftJoin(
      //   Agreement,
      //   "agreement",
      //   "agreement.id = accountReceivable.agreementId"
      // )
      .select("organization.orgName", "orgName")
      .addSelect("receipt.paidDate", "paidDate")
      // .addSelect((subQuery) => {
      //   return (
      //     subQuery
      //       .select(`item2.ref3`)
      //       .from(ReceiptItem, "item2")
      //       // .innerJoin("accTrans1.accountReceivable", "accountReceivable1")
      //       .where("item2.receiptId. = receipt.id")
      //   );
      //   // .andWhere(`accTrans1.paidDate <= :lastDate`, { lastDate });
      // }, `ref3`)
      // .addSelect("item.ref1", "ref1")
      // .addSelect("item.ref2", "ref2")
      // .addSelect("item.ref3", "ref3")
      // .addSelect("agreement.documentNumber", "ref3")
      // .addSelect("item.ref4", "ref4")
      .addSelect("receipt.subtotal", "paidAmount")
      .addSelect("receipt.clientName", "paidByName")
      // .addSelect("accTrans.paymentType", "paymentType")
      // .addSelect("receipt.paymentMethod", "paymentMethod")
      .addSelect("receipt.documentNumber", "paymentReferenceNo")
      .addSelect("receipt.updatedByName", "updatedByName")
      .addSelect(
        "receipt.cancelApprovedManagerName",
        "cancelApprovedManagerName"
      )
      .addSelect("receipt.createdByName", "createdByName")
      .addSelect("receipt.documentNote", "documentNote")
      .addSelect((subQuery) => {
        return subQuery
          .select(`item2.ref3`)
          .from(ReceiptItem, "item2")
          .where("item2.receiptId = receipt.id")
          .limit(1);
      }, `ref3`);
    reportQuery.where("receipt.status = :status", {
      status: receiptStatusSet.cancel,
    });
    if (startPaidDateParam && endPaidDateParam) {
      reportQuery.andWhere(
        "receipt.paidDate BETWEEN :startDocumentDate AND :endDocumentDate + INTERVAL 1 DAY",
        {
          startDocumentDate: startPaidDateParam,
          endDocumentDate: endPaidDateParam,
        }
      );
    }
    if (organizationIdParam) {
      reportQuery.andWhere("organization.id=:organizationId", {
        organizationId: organizationIdParam,
      });
    }
    try {
      data = await reportQuery
        .groupBy("receipt.documentNumber")
        // .addGroupBy("item.ref2")
        // .addGroupBy("item.ref3")
        // .addGroupBy("item.ref4")
        // .addGroupBy("receipt.id")
        // .groupBy("receipt.id")
        // .addGroupBy("agreement.documentNumber")
        // .addGroupBy("item.ref1")
        // .addGroupBy("item.ref2")
        // .addGroupBy("item.ref3")
        // .addGroupBy("item.ref4")
        // .groupBy("organization.region")
        // .addGroupBy("organization.orgName")
        // .addGroupBy(`accRecTrans.paymentType`)
        .orderBy("receipt.paidDate")
        .getRawMany();
      // console.log(data.length);
      // console.log(data);

      // return res.json({ data: "test" });
      if (!data || data.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานการยกเลิกใบเสร็จรับเงิน`,
          title2: `ระหว่างวันที่ ${
            startPaidDateParam && endPaidDateParam
              ? getThaiPartialDate(startPaidDateParam) +
                " - " +
                getThaiPartialDate(endPaidDateParam) +
                " ของหน่วยงาน" +
                `${data[0].orgName}`
              : "-"
          }`,
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: data,
        };

        const resp = await jsreport.render({
          template: { name: "REPORT3-acc-xlsx" },
          data: templateData,
        });

        const reportName = `ReceiptReport3${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
  printReport5 = async (req, res, next) => {
    const organizationIdParam = req.query.organizationId;
    const fiscalYearParam = req.query.fiscalYear;
    const monthParam = req.query.month;
    const regionParam = req.query.region;
    const year = +fiscalYearParam - 543;
    const firstDate = `${year}-${monthParam}-01`;

    if (!organizationIdParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกหน่วยงาน",
        })
      );
    }
    // if (!posRefType) {
    //   return next(
    //     new NotFoundError({
    //       name: "กรุณาเลือกรูปแบบการชำระ",
    //     })
    //   );
    // }
    if (!fiscalYearParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกปี",
        })
      );
    }
    if (!monthParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกเดือน",
        })
      );
    }

    const reportQuery = getRepository(AccountReceivableTransaction)
      // const reportQuery = getRepository(ReceiptItem)

      .createQueryBuilder("accTrans")
      // .createQueryBuilder("receiptItems")
      .leftJoin("accTrans.accountReceivable", "accountReceivable")
      // .leftJoin(AccountReceivable, "accountReceivable")
      .leftJoin("accountReceivable.agreement", "agreement")
      .leftJoin("accountReceivable.organization", "organization")
      // .leftJoin(
      //   ReceiptItem,
      //   "item",
      //   "item.refType = 'AR' AND item.refId = accountReceivable.id"
      // )
      // .leftJoin(Receipt, "receipt", "receipt.id = item.receiptId ")
      .leftJoin(Receipt, "receipt", "receipt.documentNumber= accTrans.paymentReferenceNo")
      .select("organization.orgName", "orgName")
      .addSelect("agreement.documentNumber", "documentNumber")
      .addSelect("accTrans.paidDate", "paidDate")
      .addSelect("accTrans.paidAmount", "paidAmount")
      .addSelect("accTrans.paymentType", "paymentType")
      .addSelect("accTrans.paymentMethod", "paymentMethod")
      .addSelect("accTrans.paymentReferenceNo", "paymentReferenceNo")
      .addSelect("accTrans.createdByName", "createdByName")
      // .addSelect("agreement.documentNumber", "documentNumber")
      // .addSelect("receipt.clientName", "paidByName")
      .addSelect("accountReceivable.name", "paidByName")
      // .addSelect("receipt.documentNote", "documentNote")
      .addSelect(
        `CASE  
          WHEN accTrans.outstandingDebtBalance = 0.00 AND accountReceivable.status = "11" THEN CONCAT('ปิดบัญชี: ', accountReceivable.comments)
          WHEN accTrans.outstandingDebtBalance = 0.00 AND accountReceivable.status = "33" THEN CONCAT('ปิดบัญชี เนื่องจากตัดเป็นหนี้สูญ: ', accountReceivable.comments)
          ELSE receipt.documentNote
          END`,
        "documentNote"
      )
      // .addSelect(
        //   `CASE  
        //   WHEN accTrans.paymentType = 'CS' THEN 'C.S'
        //   WHEN accTrans.paymentType = 'OFFICE' THEN 'OFFICE'
        //   ELSE accTrans.paymentType 
        //   END`,
        //   "cs"
        // )
      .addSelect(
        "IF((receipt.paymentMethod = 'CASH' OR accTrans.paymentMethod ='CASH') AND receipt.paymentMethod NOT IN ('MONEYORDER','CHECK','TRANSFER') , accTrans.paidAmount, '')",
        "cash"
      )
      .addSelect(
        "IF(receipt.paymentMethod = 'MONEYORDER' OR accTrans.paymentMethod ='MONEYORDER', accTrans.paidAmount, '')",
        "moneyOrder"
      )
      .addSelect(
        "IF(receipt.paymentMethod = 'CHECK' OR accTrans.paymentMethod ='CHECK', accTrans.paidAmount, '')",
        "check"
      )
      .addSelect(
        "IF(accTrans.paymentType = 'KTB', accTrans.paidAmount, '')",
        "ktb"
      )
      .addSelect(
        "IF((receipt.paymentMethod = 'TRANSFER' OR accTrans.paymentMethod ='TRANSFER') AND accTrans.paymentType != 'KTB', accTrans.paidAmount, '')",
        "transfer" 
      )
      .addSelect(
        "IF(accTrans.paymentType NOT IN ('CS','OFFICE', 'KTB') AND receipt.paymentMethod NOT IN ('CASH','MONEYORDER', 'CHECK','TRANSFER') , accTrans.paidAmount, '')",
        "other"
      );
    // .addSelect("item.name");
    // if (startPaidDateParam && endPaidDateParam) {
    //   reportQuery.andWhere(
    //     "accTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
    //     {
    //       startDocumentDate: startPaidDateParam,
    //       endDocumentDate: endPaidDateParam,
    //     }
    //   );
    // }
    reportQuery.andWhere(
      "accTrans.paidDate BETWEEN :startDocumentDate AND LAST_DAY(:endDocumentDate)",
      {
        startDocumentDate: firstDate,
        // endDocumentDate: `LAST_DAY(${firstDate})`,
        endDocumentDate: firstDate+" 23:59:00",
      }
    );
    if (organizationIdParam) {
      reportQuery.andWhere("organization.id=:organizationId", {
        organizationId: organizationIdParam,
      });
    }
    // ภาค
    if (regionParam) {
      //
      reportQuery.andWhere("organization.region=:region", {
        region: regionParam,
      });
    }
    reportQuery.orderBy("accTrans.paidDate");

    try {
      const data = await reportQuery
        // .groupBy("organization.region")
        // .addGroupBy("organization.orgName")
        // .addGroupBy(`accRecTrans.paymentType`)
        .getRawMany();

      // return res.json({ data: "test" });
      if (!data || data.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานสรุปยอดชำระหนี้`,
          title2: `ประจำเดือน${months[monthParam - 1]} ปีงบประมาณ${
            fiscalYearParam || ""
          } ของหน่วยงาน${data[0].orgName}`,
          // fiscalYear: fiscalYearParam || "-",
          // title2: `ระหว่าง ${
          //   startPaidDateParam && endPaidDateParam
          //     ? getThaiPartialDate(startPaidDateParam) +
          //       " - " +
          //       getThaiPartialDate(endPaidDateParam)
          //     : "-"
          // }`,
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: data,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT1-acc-xlsx" },
          data: templateData,
        });

        const reportName = `ReceiptReport5${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
  printReport4 = async (req, res, next) => {
    const startPaidDateParam = req.query.startPaidDate;
    const endPaidDateParam = req.query.endPaidDate;
    const organizationIdParam = req.query.organizationId;
    const documentNumberParam = req.query.documentNumber;
    if (!organizationIdParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกหน่วยงาน",
        })
      );
    }
    // if (!posRefType) {
    //   return next(
    //     new NotFoundError({
    //       name: "กรุณาเลือกรูปแบบการชำระ",
    //     })
    //   );
    // }
    if (!startPaidDateParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกช่วงวันที่ชำระเงิน",
        })
      );
    }
    if (!endPaidDateParam) {
      return next(
        new NotFoundError({
          name: "กรุณาเลือกช่วงวันที่ชำระเงิน",
        })
      );
    }
    const bankObj = {};
    const bankList = getEnumSetList("bank");
    bankList.forEach((item: IItemSet) => {
      bankObj[`${item.value}`] = item.text;
    });

    const reportQuery = getRepository(Voucher).createQueryBuilder("voucher");
    reportQuery
      .leftJoin("voucher.organization", "organization")
      .leftJoin(
        Agreement,
        "agreement",
        "agreement.id = voucher.refId AND voucher.refType = 'AGREEMENT'"
      );
    reportQuery
      .select("organization.orgName", "orgName")
      .addSelect("voucher.partnerName", "partnerName")
      .addSelect("voucher.paidDate", "paidDate")
      .addSelect("agreement.documentNumber", "refDocumentNumber")
      .addSelect("agreement.loanAmount", "loanAmount")
      .addSelect("voucher.toBankName", "toBankName")
      .addSelect("voucher.toAccountNo", "toAccountNo")
      .addSelect("voucher.documentNumber", "documentNumber")
      .addSelect("voucher.recieveBankAccountRefNo", "ktbRefNo")
      .addSelect("voucher.toSms", "telephone")
      // .addSelect(
      //   "IF(voucher.payByName IS NOT NULL, voucher.payByName, IF(voucher.updatedByName IS NOT NULL, voucher.updatedByName, voucher.createdByName))",
      //   "payByName"
      // );
      .addSelect(
        "IF(voucher.updatedByName != '', voucher.updatedByName, voucher.createdByName)",
        "payByName"
      )
      .addSelect("voucher.createdByName", "payByName");

    reportQuery.where("voucher.status = 'PD'");

    if (startPaidDateParam && endPaidDateParam) {
      reportQuery.andWhere(
        "voucher.paidDate BETWEEN :startDocumentDate AND :endDocumentDate + INTERVAL 1 DAY",
        {
          startDocumentDate: startPaidDateParam,
          endDocumentDate: endPaidDateParam,
        }
      );
    }
    if (organizationIdParam) {
      reportQuery.andWhere("organization.id=:organizationId", {
        organizationId: organizationIdParam,
      });
    }
    if (documentNumberParam) {
      reportQuery.andWhere("agreement.documentNumber =:documentNumber", {
        documentNumber: documentNumberParam,
      });
    }
    try {
      const data = await reportQuery.orderBy("voucher.paidDate").getRawMany();
      if (!data || data.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานการนำจ่ายเงินกู้`,
          title2: `ระหว่างวันที่ ${
            startPaidDateParam && endPaidDateParam
              ? getThaiPartialDate(startPaidDateParam) +
                " - " +
                getThaiPartialDate(endPaidDateParam) +
                " ของหน่วยงาน" +
                `${data[0].orgName}`
              : "-"
          }`,
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: data,
          bankObj,
        };

        const resp = await jsreport.render({
          template: { name: "REPORT4-acc-xlsx" },
          data: templateData,
        });

        const reportName = `ReceiptReport4${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
}

export const controller = new ReceiptReportController(
  "AccountReceivable",
  "รายงานการชำระเงิน"
);
