import { getRepository } from "typeorm";

import { arTransactionStatusSet } from "../../enumset";
import { BaseController } from "./BaseController";
import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import { CounterService } from "../../entities/CounterService";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { Agreement } from "../../entities/Agreement";
import { Organization } from "../../entities/Organization";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import { getEnumSetText } from "../../utils/get-enum-set-text";

class CounterServiceController extends BaseController {
  private reportNotFoundMessage =
    "ไม่พบข้อมูลสำหรับออกรายงาน กรุณาเลือกเงื่อนไขใหม่";

  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  setParams = (req, res, next) => {
    if (req.query.status === arTransactionStatusSet.normal) {
      req.query.METHOD = ["DataExchange", "DataExchangeConfirm"];
    } else if (req.query.status === arTransactionStatusSet.cancel) {
      req.query.METHOD = ["OR", "ORConfirm"];
    }

    req.query.TX_ID = req.query.TX_ID ? req.query.TX_ID : -1;
    req.query.perPage = 99;

    next();
  };

  // รายงานการชำระเงินผ่านเคาร์เตอร์เซอร์วิส
  public printPaymentviaCounterServiceReport = async (req, res, next) => {
    try {
      const paidDateParam = req.query.paidDate;
      const yearMonthParam = req.query.yearMonth;
      let yearMonthSplit, year, month;
      if (yearMonthParam) {
        yearMonthSplit = yearMonthParam.split("-");
        year = yearMonthSplit[0];
        month = yearMonthSplit[1];
      }
      const startDocumentDateParam = req.query.startDocumentDate;
      const endDocumentDateParam = req.query.endDocumentDate;
      const organizationIdParam = req.query.organizationId;

      let accountTransQuery = await getRepository(AccountReceivableTransaction)
        .createQueryBuilder("accTrans")
        .innerJoin(CounterService, "cs", "cs.id = accTrans.paymentId")
        .innerJoin(
          AccountReceivable,
          "accountReceivable",
          "accountReceivable.id = accTrans.accountReceivableId"
        )
        .innerJoin(
          Agreement,
          "agreement",
          "accountReceivable.agreementId = agreement.id"
        )
        .innerJoin(
          Organization,
          "organization",
          `organization.id = accountReceivable.organizationId AND
          accTrans.paymentType = "CS" AND
          accTrans.status = "NM"`
        )

        .select(`accTrans.paidDate`, "paidDate")
        .addSelect("accountReceivable.name", "name")
        .addSelect("cs.REFERENCE_1", "reference1")
        .addSelect("cs.REFERENCE_2", "reference2")
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect("agreement.fiscalYear", "fiscalYear")
        .addSelect("organization.orgCode", "orgCode")
        .addSelect("organization.addressProvince", "addressProvince")
        .addSelect(`IF(cs.ZONE = 1 , "นครหลวง", "ภูมิภาค")`, "paymentAreaType")
        .addSelect("cs.COUNTER_NO", "counterNo")
        .addSelect("cs.SERVICE_RUN_NO", "serviceRunNo")
        .addSelect("cs.TERM_NO", "termNo")
        .addSelect("cs.AMOUNT_RECEIVED", "amount")
        .addSelect("organization.orgName", "orgName");

      // รายวัน
      if (paidDateParam) {
        accountTransQuery.where(`accTrans.paidDate = :paidDate`, {
          paidDate: paidDateParam
        });
      }
      // รายเดือน
      if (yearMonthParam && yearMonthSplit && yearMonthSplit.length === 2) {
        accountTransQuery.andWhere(
          "YEAR(accTrans.paidDate) = :year AND MONTH(accTrans.paidDate) = :month",
          {
            year: year,
            month: month
          }
        );
      }
      // ช่วงเวลา
      if (startDocumentDateParam || endDocumentDateParam) {
        accountTransQuery.andWhere(
          "accTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: startDocumentDateParam,
            endDocumentDate: endDocumentDateParam
          }
        );
      }
      // หน่วยงาน
      if (organizationIdParam) {
        accountTransQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam
        });
      }

      const query = accountTransQuery
        .orderBy("accTrans.paidDate")
        .addOrderBy("cs.zone")
        .addOrderBy("organization.orgCode")
        .getQueryAndParameters();
      console.log(query);

      const accountTrans = await accountTransQuery
        .orderBy("accTrans.paidDate")
        .addOrderBy("cs.zone")
        .addOrderBy("organization.orgCode")
        .getRawMany();

      if (!accountTrans || accountTrans.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage
          })
        );
      } else {
        let paymentTime = "";
        if (paidDateParam) {
          paymentTime = `เวลาที่ชำระ ณ วันที่ ${getThaiPartialDate(
            paidDateParam
          )}`;
        } else if (
          yearMonthParam &&
          yearMonthSplit &&
          yearMonthSplit.length === 2
        ) {
          paymentTime = `เวลาที่ชำระ ประจำเดือน ${getEnumSetText(
            "monthTH",
            +month
          )}`;
        } else if (startDocumentDateParam && endDocumentDateParam) {
          paymentTime = `เวลาที่ชำระ ตั้งแต่วันที่ ${getThaiPartialDate(
            startDocumentDateParam
          )} ถึงวันที่ ${getThaiPartialDate(endDocumentDateParam)}`;
        }

        const templateData = {
          title1: `รายงานสรุปรายการชำระเงินผ่านเคาน์เตอร์เซอวิส`,
          title2: organizationIdParam
            ? `บัญชีลูกหนี้ของ ${accountTrans[0].orgName}`
            : "",
          paymentTime: paymentTime,
          data: accountTrans
        };

        // res.send(templateData);

        const resp = await jsreport.render({
          // template: { name: "CounterServiceReport" },
          template: { name: "CS-Report-xlsx-recipe" },
          // template: { name: "CS-report-xlsx-recipe" },
          data: templateData
        });

        const reportName = `PaymentviaCounterServiceReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // รายงานการยกเลิกการชำระเงินผ่านเคาเตอร์เซอร์วิส
  public printCancelPaymentviaCounterServiceReport = async (req, res, next) => {
    try {
      const paidDateParam = req.query.paidDate;
      const yearMonthParam = req.query.yearMonth;
      let yearMonthSplit, year, month;
      if (yearMonthParam) {
        yearMonthSplit = yearMonthParam.split("-");
        year = yearMonthSplit[0];
        month = yearMonthSplit[1];
      }
      const startDocumentDateParam = req.query.startDocumentDate;
      const endDocumentDateParam = req.query.endDocumentDate;
      const organizationIdParam = req.query.organizationId;

      let accountTransQuery = await getRepository(AccountReceivableTransaction)
        .createQueryBuilder("accTrans")
        .innerJoin(CounterService, "cs", "cs.id = accTrans.paymentId")
        .innerJoin(
          AccountReceivable,
          "accountReceivable",
          "accountReceivable.id = accTrans.accountReceivableId"
        )
        .innerJoin(
          Agreement,
          "agreement",
          "accountReceivable.agreementId = agreement.id"
        )
        .innerJoin(
          Organization,
          "organization",
          `organization.id = accountReceivable.organizationId AND
          accTrans.paymentType = "CS" AND
          accTrans.status = "CL"`
        )

        .select(`accTrans.paidDate`, "paidDate")
        .addSelect("accountReceivable.name", "name")
        .addSelect("cs.REFERENCE_1", "reference1")
        .addSelect("cs.REFERENCE_2", "reference2")
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect("agreement.fiscalYear", "fiscalYear")
        .addSelect("organization.orgCode", "orgCode")
        .addSelect("organization.addressProvince", "addressProvince")
        .addSelect(`IF(cs.ZONE = 1 , "นครหลวง", "ภูมิภาค")`, "paymentAreaType")
        .addSelect("cs.COUNTER_NO", "counterNo")
        .addSelect("cs.SERVICE_RUN_NO", "serviceRunNo")
        .addSelect("cs.TERM_NO", "termNo")
        .addSelect("cs.AMOUNT_RECEIVED", "amount")
        .addSelect("organization.orgName", "orgName");

      // รายวัน
      if (paidDateParam) {
        accountTransQuery.where(`accTrans.paidDate = :paidDate`, {
          paidDate: paidDateParam
        });
      }
      // รายเดือน
      if (yearMonthParam && yearMonthSplit && yearMonthSplit.length === 2) {
        accountTransQuery.andWhere(
          "YEAR(accTrans.paidDate) = :year AND MONTH(accTrans.paidDate) = :month",
          {
            year: year,
            month: month
          }
        );
      }
      // ช่วงเวลา
      if (startDocumentDateParam || endDocumentDateParam) {
        accountTransQuery.andWhere(
          "accTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: startDocumentDateParam,
            endDocumentDate: endDocumentDateParam
          }
        );
      }
      // หน่วยงาน
      if (organizationIdParam) {
        accountTransQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam
        });
      }

      const query = accountTransQuery
        .orderBy("accTrans.paidDate")
        .addOrderBy("cs.zone")
        .addOrderBy("organization.orgCode")
        .getQueryAndParameters();
      console.log(query);

      const accountTrans = await accountTransQuery
        .orderBy("accTrans.paidDate")
        .addOrderBy("cs.zone")
        .addOrderBy("organization.orgCode")
        .getRawMany();

      if (!accountTrans || accountTrans.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage
          })
        );
      } else {
        let paymentTime = "";
        if (paidDateParam) {
          paymentTime = `เวลาที่ชำระ ณ วันที่ ${getThaiPartialDate(
            paidDateParam
          )}`;
        } else if (
          yearMonthParam &&
          yearMonthSplit &&
          yearMonthSplit.length === 2
        ) {
          paymentTime = `เวลาที่ชำระ ประจำเดือน ${getEnumSetText(
            "monthTH",
            +month
          )}`;
        } else if (startDocumentDateParam && endDocumentDateParam) {
          paymentTime = `เวลาที่ชำระ ตั้งแต่วันที่ ${getThaiPartialDate(
            startDocumentDateParam
          )} ถึงวันที่ ${getThaiPartialDate(endDocumentDateParam)}`;
        }

        const templateData = {
          title1: `รายงานการยกเลิกการชำระเงินผ่านเคาเตอร์เซอร์วิส`,
          title2: organizationIdParam
            ? `บัญชีลูกหนี้ของ ${accountTrans[0].orgName}`
            : "",
          paymentTime: paymentTime,
          data: accountTrans
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          // template: { name: "CounterServiceReport" },
          template: { name: "CS-Report-xlsx-recipe" },
          data: templateData
        });

        const reportName = `CancelPaymentviaCounterServiceReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // รายงานสรุปรายการรับส่งข้อมูลระหว่างกรมผู้สูงอายุ และ เคาน์เตอร์เซอวิส
  public printCounterServiceTransactionLogReport = async (req, res, next) => {
    try {
      const paidDateParam = req.query.paidDate;
      const yearMonthParam = req.query.yearMonth;
      let yearMonthSplit, year, month;
      if (yearMonthParam) {
        yearMonthSplit = yearMonthParam.split("-");
        year = yearMonthSplit[0];
        month = yearMonthSplit[1];
      }
      const startDocumentDateParam = req.query.startDocumentDate;
      const endDocumentDateParam = req.query.endDocumentDate;
      const zoneParam = req.query.zone;

      let counterServiceTransactionQuery = await getRepository(
        CounterService
      ).createQueryBuilder("cs");

      // รายวัน
      if (paidDateParam) {
        counterServiceTransactionQuery.where(
          `DATE(cs.createdDate) = :paidDate`,
          {
            paidDate: paidDateParam
          }
        );
      }
      // รายเดือน
      if (yearMonthParam && yearMonthSplit && yearMonthSplit.length === 2) {
        counterServiceTransactionQuery.andWhere(
          "YEAR(cs.createdDate) = :year AND MONTH(cs.createdDate) = :month",
          {
            year: year,
            month: month
          }
        );
      }
      // ช่วงเวลา
      if (startDocumentDateParam || endDocumentDateParam) {
        counterServiceTransactionQuery.andWhere(
          "cs.createdDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: startDocumentDateParam,
            endDocumentDate: endDocumentDateParam
          }
        );
      }
      // โซน
      if (zoneParam) {
        counterServiceTransactionQuery.andWhere("cs.ZONE = :zone", {
          zone: zoneParam
        });
      }

      const counterServiceTransaction = await counterServiceTransactionQuery.getMany();

      if (!counterServiceTransaction || counterServiceTransaction.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage
          })
        );
      } else {
        let paymentTime = "";
        if (paidDateParam) {
          paymentTime = `เวลาที่ชำระ ณ วันที่ ${getThaiPartialDate(
            paidDateParam
          )}`;
        } else if (
          yearMonthParam &&
          yearMonthSplit &&
          yearMonthSplit.length === 2
        ) {
          paymentTime = `เวลาที่ชำระ ประจำเดือน ${getEnumSetText(
            "monthTH",
            +month
          )}`;
        } else if (startDocumentDateParam && endDocumentDateParam) {
          paymentTime = `เวลาที่ชำระ ตั้งแต่วันที่ ${getThaiPartialDate(
            startDocumentDateParam
          )} ถึงวันที่ ${getThaiPartialDate(endDocumentDateParam)}`;
        }

        const templateData = {
          title1: `รายงานสรุปรายการรับส่งข้อมูลระหว่างกรมผู้สูงอายุ และ เคาน์เตอร์เซอวิส`,
          title2: zoneParam ? `โซน ${getEnumSetText("csZone", zoneParam)}` : "",
          paymentTime: paymentTime,
          data: counterServiceTransaction
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          // template: { name: "CounterServiceTransactionLogReport" },
          template: { name: "CS-TransLogReport-xlsx-recipe" },
          data: templateData
        });

        const reportName = `CounterServiceTransactionLogReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };
}

export const controller = new CounterServiceController(
  "CounterService",
  "เคาท์เตอร์เซอร์วิส"
);
