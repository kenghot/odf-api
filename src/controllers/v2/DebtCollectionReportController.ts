import moment = require("moment");
import { Brackets, getRepository } from "typeorm";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { DebtCollection } from "../../entities/DebtCollection";
import { DebtCollectionLetter } from "../../entities/DebtCollectionLetter";
import { DebtCollectionVisit } from "../../entities/DebtCollectionVisit";
import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import { addSelectRegion } from "../queries-utils/organization-queries";
import { BaseController } from "./BaseController";

class DebtCollectionReportController extends BaseController {
  constructor(entityClass: string, entityInfo) {
    super(entityClass, entityInfo);
  }
  // Report 1
  printSueReport = async (req, res, next) => {
    const fiscalYearParam = req.query.fiscalYear;
    const organizationIdParam = req.query.organizationId;
    const lastDate = `${fiscalYearParam - 543}-09-30`;
    const year = +fiscalYearParam - 543;
    const prevYear = year - 1;
    const firstDateOfYear = `${prevYear}-10-01`;
    try {
      // if (!fiscalYearParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกปีงบประมาณ",
      //     })
      //   );
      // }
      // if (!organizationIdParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกหน่วยงาน",
      //     })
      //   );
      // }
      let debtQuery = getRepository(DebtCollection)
        .createQueryBuilder("collection")
        .leftJoin("collection.accountReceivable", "accountReceivable")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("agreement.agreementItems", "agreementItems")
        .leftJoin("accountReceivable.organization", "organization")
        .select("organization.orgName", "orgName");
      debtQuery.addSelect("collection.debtSue.isApprovedSue", "isApproveSue");
      debtQuery
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect(
          `concat(agreementItems.borrower.title, agreementItems.borrower.firstname, " ", agreementItems.borrower.lastname)`,
          "borrowerName"
        )
        .addSelect(
          `concat(agreementItems.guarantor.title, agreementItems.guarantor.firstname, " ", agreementItems.guarantor.lastname)`,
          "guarantorName"
        )
        .addSelect("accountReceivable.loanAmount", "loanAmount")
        .addSelect(
          "accountReceivable.outstandingDebtBalance",
          "outstandingDebtBalance"
        )
        .addSelect("collection.debtSue.submitDate", "submitDate")
        .addSelect("collection.debtSue.judgementDate", "judgementDate")
        .addSelect(
          "collection.debtSue.interestStartDate",
          "interestStartDate"
        )
        .addSelect("collection.debtSue.judgementBalance", "judgementBalance")
        .addSelect("collection.debtSue.lawyerFee", "lawyerFee")
        .addSelect("collection.debtSue.fee", "fee")
        .addSelect("collection.debtSue.otherExpense", "otherExpense")
        .addSelect(
          "collection.debtSue.judgementInterestAmount",
          "judgementInterestAmount"
        )
        .addSelect("accountReceivable.fiscalYear", "fiscalYear");

      // debtQuery.where(
      //   "collection.active = TRUE AND collection.debtSue.isApprovedSue = TRUE"
      // );
      debtQuery.where(
        "collection.active = TRUE AND accountReceivable.status = '30'"
      );
      // ปีงบประมาณ
      if (fiscalYearParam) {
        debtQuery.andWhere("collection.debtSue.submitDate <= :lastDate", {
          lastDate,
        });
      }
      // หน่วยงานที่รับผิดชอบ (จังหวัด)
      if (organizationIdParam) {
        debtQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      const records = await debtQuery.getRawMany();
      if (!records || records.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานการดำเนินคดีของลูกหนี้ ประจำปี ${
            req.query.fiscalYear || "-"
          } ของหน่วยงาน${organizationIdParam ? records[0].orgName : ""}`,
          title2: fiscalYearParam
            ? `ระหว่าง ${
                firstDateOfYear && lastDate
                  ? getThaiPartialDate(firstDateOfYear) +
                    " - " +
                    getThaiPartialDate(lastDate)
                  : "-"
              }`
            : "",
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: records,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "DEBTREPORT1" },
          data: templateData,
        });

        const reportName = `DebtReport1${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
  // Report 2
  printDebtRepaymentReport = async (req, res, next) => {
    const fiscalYearParam = req.query.fiscalYear;
    const organizationIdParam = req.query.organizationId;
    const lastDate = `${fiscalYearParam - 543}-09-30`;
    try {
      // if (!fiscalYearParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกปีงบประมาณ",
      //     })
      //   );
      // }
      // if (!organizationIdParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกหน่วยงาน",
      //     })
      //   );
      // }
      let accountReceivableQuery = await getRepository(AccountReceivable)
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.transactions", "accTrans")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("accountReceivable.organization", "organization")
        .select("organization.orgName", "orgName");

      const year = +fiscalYearParam - 543;
      const prevYear = year - 1;
      const firstDateOfYear = `${prevYear}-10-01`;
      const lastDateOfYear = `${year}-09-30`;

      accountReceivableQuery
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect("agreement.loanAmount", "loanAmount")
        .addSelect("accTrans.paidDate", "lastPaymentDate")
        .addSelect("accTrans.paymentType", "paymentType")
        .addSelect("accTrans.paidAmount", "paidAmount")
        .addSelect(
          // "accountReceivable.outstandingDebtBalance",
          "accTrans.outstandingDebtBalance",
          "outstandingDebtBalance"
        )
        .addSelect(
          `CASE accountReceivable.status
            WHEN "11" THEN "ปิดบัญชี"
            WHEN "33" THEN "ปิดบัญชี เนื่องจากตัดเป็นหนี้สูญ"
          END`,
          "status"
        )
        .addSelect("accountReceivable.fiscalYear", "fiscalYear");

      // ปีงบประมาณ
      if (fiscalYearParam) {
        //
        accountReceivableQuery.andWhere(
          "accTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: firstDateOfYear,
            endDocumentDate: lastDateOfYear,
          }
        );
      }
      // accountReceivableQuery.andWhere("accTrans.outstandingDebtBalance = 0.00");
      accountReceivableQuery.andWhere(
        new Brackets((qb) => {
          qb.where("accTrans.outstandingDebtBalance = 0.00").orWhere(
            "accountReceivable.debtAcknowledgementIsAcknowledge = TRUE"
          );
        })
      );

      // หน่วยงานที่รับผิดชอบ (จังหวัด)
      if (organizationIdParam) {
        //
        accountReceivableQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }
      // status ปิดบัญชี 11
        accountReceivableQuery.andWhere("accountReceivable.status=11");
      

      const records = await accountReceivableQuery.getRawMany();
      if (!records || records.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานปิดบัญชี ประจำปี ${
            req.query.fiscalYear || "-"
          } ของหน่วยงาน${organizationIdParam ? records[0].orgName : ""}`,
          title2: fiscalYearParam
            ? `ระหว่าง ${
                firstDateOfYear && lastDate
                  ? getThaiPartialDate(firstDateOfYear) +
                    " - " +
                    getThaiPartialDate(lastDate)
                  : "-"
              }`
            : "",
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: records,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "DEBTREPORT2" },
          data: templateData,
        });

        const reportName = `DebtReport2${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  };
  // Report 6
  printDebtAcknowledgementReport = async (req, res, next) => {
    const fiscalYearParam = req.query.fiscalYear;
    const organizationIdParam = req.query.organizationId;
    const startDocumentDateParam = req.query.startDocumentDate;
    const endDocumentDateParam = req.query.endDocumentDate;
    const lastDate = `${fiscalYearParam - 543}-09-30`;
    try {
      // if (!fiscalYearParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกปีงบประมาณ",
      //     })
      //   );
      // }
      // if (!organizationIdParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกหน่วยงาน",
      //     })
      //   );
      // }
      let accountReceivableQuery = await getRepository(AccountReceivable)
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("agreement.agreementItems", "agreementItems")
        .leftJoin("accountReceivable.organization", "organization")
        .leftJoin(
          DebtCollection,
          "collection",
          "accountReceivable.debtAcknowledgement.preDebtCollectionId = collection.id"
        )
        .select("organization.orgName", "orgName");

      const year = +fiscalYearParam - 543;
      const prevYear = year - 1;
      const firstDateOfYear = `${prevYear}-10-01`;
      const lastDateOfYear = `${year}-09-30`;

      accountReceivableQuery
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect(
          `concat(agreementItems.borrower.title, agreementItems.borrower.firstname, " ", agreementItems.borrower.lastname)`,
          "borrowerName"
        )
        .addSelect("collection.deathNotification.isConfirm", "isDead")
        .addSelect(
          `IF(collection.deathNotification.isConfirm = TRUE,concat(accountReceivable.debtAcknowledgement.title, accountReceivable.debtAcknowledgement.firstname, " ", accountReceivable.debtAcknowledgement.lastname), '')`,
          "acknowledgeName"
        )
        .addSelect(
          "accountReceivable.debtAcknowledgement.acknowledgeDate",
          "acknowledgeDate"
        )
        .addSelect(
          "accountReceivable.debtAcknowledgement.debtAmount",
          "debtAmount"
        )
        // .addSelect("collection.interruptReason", "interruptReason")
        // .addSelect(
        //   "collection.deathNotification.notificationDate",
        //   "notificationDate"
        // )
        // .addSelect(
        //   `IF(collection.deathNotification.isConfirm = TRUE, DATE_ADD(collection.deathNotification.notificationDate, INTERVAL 1 DAY), DATE_ADD(accountReceivable.tentativeOverdueDate, INTERVAL 1 DAY))`,
        //   "tentativeOverdueDate"
        // )
        .addSelect(
          `
          CASE
            WHEN collection.deathNotification.isConfirm = TRUE THEN DATE_ADD(collection.deathNotification.notificationDate, INTERVAL 1 DAY)
            WHEN collection.interruptReason = "AF" THEN accountReceivable.debtAcknowledgement.acknowledgeDate
            ELSE DATE_ADD(accountReceivable.tentativeOverdueDate, INTERVAL 1 DAY)
          END
        
        `,
          "tentativeOverdueDate"
        )
        .addSelect(
          `
          CASE
            WHEN collection.deathNotification.isConfirm = TRUE THEN DATE_ADD(collection.deathNotification.notificationDate, INTERVAL 1 YEAR)
            WHEN collection.interruptReason = "AF" THEN DATE_ADD(accountReceivable.debtAcknowledgement.acknowledgeDate, INTERVAL 2 YEAR)
            ELSE DATE_ADD(accountReceivable.tentativeOverdueDate, INTERVAL 5 YEAR)
          END
        
        `,
          "endDate"
        );
      // .addSelect(
      //   `IF(collection.deathNotification.isConfirm = TRUE, DATE_ADD(collection.deathNotification.notificationDate, INTERVAL 1 YEAR), DATE_ADD(accountReceivable.tentativeOverdueDate, INTERVAL 5 YEAR))`,
      //   "endDate"
      // );

      accountReceivableQuery.where(
        "accountReceivable.debtAcknowledgement.isAcknowledge = TRUE"
      );

      // ปีงบประมาณ
      if (fiscalYearParam) {
        //
        accountReceivableQuery.andWhere(
          "accountReceivable.debtAcknowledgement.acknowledgeDate BETWEEN :startDate AND :endDate",
          {
            startDate: firstDateOfYear,
            endDate: lastDateOfYear,
          }
        );
      }

      // หน่วยงานที่รับผิดชอบ (จังหวัด)
      if (organizationIdParam) {
        //
        accountReceivableQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      if (startDocumentDateParam && endDocumentDateParam) {
        accountReceivableQuery.andWhere(
          "agreement.documentDate BETWEEN :startDate2 AND :endDate2",
          {
            startDate2: startDocumentDateParam,
            endDate2: endDocumentDateParam,
          }
        );
      }

      const records = await accountReceivableQuery.getRawMany();
      if (!records || records.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานการรับสภาพหนี้ของลูกหนี้กองทุนผู้สูงอายุ
        ประจำปี ${req.query.fiscalYear || "-"} ของหน่วยงาน${
            organizationIdParam ? records[0].orgName : ""
          }`,
          title2: fiscalYearParam
            ? `ระหว่าง ${
                fiscalYearParam
                  ? getThaiPartialDate(firstDateOfYear || "") +
                    " - " +
                    getThaiPartialDate(lastDate || "")
                  : "-"
              }`
            : "",
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: records,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "DEBTREPORT6" },
          data: templateData,
        });

        const reportName = `DebtReport6${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
  // Report 7
  printVisitReport = async (req, res, next) => {
    const fiscalYearParam = req.query.fiscalYear;
    const organizationIdParam = req.query.organizationId;
    const lastDate = `${fiscalYearParam - 543}-09-30`;
    const today = moment(new Date());
    try {
      // if (!fiscalYearParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกปีงบประมาณ",
      //     })
      //   );
      // }
      // if (!organizationIdParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกหน่วยงาน",
      //     })
      //   );
      // }
      let debtQuery = getRepository(DebtCollection)
        .createQueryBuilder("collection")
        .leftJoin("collection.letters", "letter")
        .leftJoin(
          "collection.letters",
          "nextLetter",
          "letter.postDate < nextLetter.postDate"
        )
        .leftJoin("collection.visits", "visit")
        .leftJoin(
          "collection.visits",
          "nextVisit",
          "visit.visitDate < nextVisit.visitDate"
        )
        .leftJoin("collection.accountReceivable", "accountReceivable")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("agreement.agreementItems", "agreementItems")
        .leftJoin("accountReceivable.organization", "organization");

      debtQuery
        .select("agreement.documentNumber", "documentNumber")
        .addSelect("organization.orgName", "orgName")
        .addSelect(
          "accountReceivable.borrowerContactAddress.province",
          "province"
        )
        .addSelect(
          "accountReceivable.borrowerContactAddress.district",
          "district"
        )
        .addSelect("accountReceivable.fiscalYear", "fiscalYear")
        .addSelect("accountReceivable.loanAmount", "loanAmount")
        .addSelect(
          "accountReceivable.outstandingDebtBalance",
          "outstandingDebtBalance"
        )
        .addSelect(
          `
          CASE accountReceivable.status
            WHEN '10' THEN "ปกติ"
            WHEN '20' THEN "ค้างชำระเกิน 90 วัน"
            WHEN '11' THEN "ปิดบัญชี"
            WHEN '30' THEN "อยู่ในกระบวนการทางกฎหมาย"
            WHEN '33' THEN "ปิดบัญชี เนื่องจากตัดเป็นหนี้สูญ"
          END
        `,
          "status"
        )
        // .addSelect("letter.documentDate", "documentDate")
        .addSelect(
          `
          CASE collection.step
            WHEN 1 THEN letter.documentDate
            WHEN 2 THEN visit.visitDate
            WHEN 3 THEN collection.debtSue.submitDate
            ELSE ''
          END
        
        `,
          "documentDate"
        )
        .addSelect(
          `concat(agreementItems.borrower.title, agreementItems.borrower.firstname, " ", agreementItems.borrower.lastname)`,
          "borrowerName"
        )
        .addSelect(
          `IF(collection.deathNotification.isConfirm = TRUE,concat(accountReceivable.debtAcknowledgement.title, accountReceivable.debtAcknowledgement.firstname, " ", accountReceivable.debtAcknowledgement.lastname), '')`,
          "acknowledgeName"
        )
        .addSelect("letter.postDate", "letterDate")
        .addSelect(
          `
          CASE letter.isSentBack
            WHEN 0 THEN "จดหมายถึงมือผู้รับ"
            WHEN 1 THEN "จดหมายถูกตีกลับ"
            ELSE ""
          END
        `,
          "isSentBack"
        )
        .addSelect(
          `
          CASE letter.sentBackReasonType
            WHEN 1 THEN "จ่าหน้าซองไม่ชัดเจน"
            WHEN 2 THEN "ไม่มีเลขที่บ้านตามจ่าหน้า"
            WHEN 3 THEN "ไม่ยอมรับ"
            WHEN 4 THEN "ไม่มีผู้รับตามจ่าหน้า"
            WHEN 5 THEN "ไม่มารับภายในกำหนด"
            WHEN 6 THEN "เลิกกิจการ"
            WHEN 7 THEN "ย้ายไม่ทราบที่อยู่ใหม่"
            WHEN 99 THEN letter.sentBackReasonTypeDescription
            ELSE ""
          END
        `,
          "reason"
        )
        .addSelect(
          `
          CASE letter.isCollectable
            WHEN 1 THEN "ได้รับการชำระเงิน"
            ELSE ""
          END
        `,
          "isCollectable"
        )
        .addSelect(
          `
          CASE visit.visitType
            WHEN "DCB" THEN "เข้าติดตามทวงถามผู้กู้"
            WHEN "DCG" THEN "เข้าติดตามทวงถามผู้ค้ำ"
            ELSE ""
          END
        `,
          "visitType"
        )
        .addSelect(
          `
          CASE visit.isMeetTarget
            WHEN 0 THEN "ไม่พบ"
            WHEN 1 THEN "พบ"
            ELSE ""
          END
        `,
          "isMeetTarget"
        )
        .addSelect(
          "IF(visit.overdueReasons, visit.overdueReasons, '')",
          "overdueReasons"
        )
        .addSelect(
          "IF(visit.dismissReason, visit.dismissReason, '')",
          "dismissReason"
        )
        .addSelect("collection.step", "step")
        .addSelect(
          `
          CASE collection.step
            WHEN 1 THEN "ทำหนังสือทวงถาม"
            WHEN 2 THEN "ติดตาม ณ ภูมิลำเนา"
            WHEN 3 THEN "ฟ้องร้องดำเนินคดี"
            ELSE "รอดำเนินงาน"
          END
        `,
          "stepLabel"
        );
      addSelectRegion(debtQuery);

      debtQuery.where("collection.active = TRUE");
      debtQuery.andWhere("nextLetter.id IS NULL");
      debtQuery.andWhere("nextVisit.id IS NULL");
      debtQuery.andWhere("accountReceivable.tentativeOverdueDate < :today", {
        today: today.format("YYYY-MM-DD"),
      });
      // debtQuery.andWhere(
      //   new Brackets((qb) => {
      //     qb.where((qb1) => {
      //       const subQuery1 = qb1
      //         .subQuery()
      //         .select("letter2.id")
      //         .from(DebtCollectionLetter, "letter2")
      //         .where("letter2.debtCollectionId = collection.id")
      //         .orderBy("letter2.postDate", "DESC")
      //         .limit(1);
      //       return `letter.id = ${subQuery1.getQuery()}`;
      //     }).orWhere("letter.id IS NULL");
      //   })
      // );
      // debtQuery.andWhere(
      //   new Brackets((qb) => {
      //     qb.where((qb1) => {
      //       const subQuery1 = qb1
      //         .subQuery()
      //         .select("visit2.id")
      //         .from(DebtCollectionVisit, "visit2")
      //         .where("visit2.debtCollectionId = collection.id")
      //         .orderBy("visit2.visitDate", "DESC")
      //         .limit(1);
      //       return `visit.id = ${subQuery1.getQuery()}`;
      //     }).orWhere("visit.id IS NULL");
      //   })
      // );
      // ปีงบประมาณ
      if (fiscalYearParam) {
        //
        debtQuery.andWhere("accountReceivable.documentDate <= :endDate", {
          endDate: lastDate,
        });
      }

      // หน่วยงานที่รับผิดชอบ (จังหวัด)
      if (organizationIdParam) {
        //
        debtQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }
      const records = await debtQuery.getRawMany();
      if (!records || records.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานบันทึกการเร่งรัดติดตามหนี้
        ประจำปี ${req.query.fiscalYear || "-"} ของหน่วยงาน${
            organizationIdParam ? records[0].orgName : ""
          }`,
          // title2: `ระหว่าง ${
          //   fiscalYearParam
          //     ? getThaiPartialDate(firstDateOfYear || "") +
          //       " - " +
          //       getThaiPartialDate(lastDate || "")
          //     : "-"
          // }`,
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: records,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "DEBTREPORT7" },
          data: templateData,
        });

        const reportName = `DebtReport7${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
  // Report8
  printPrescriptionReport = async (req, res, next) => {
    const fiscalYearParam = req.query.fiscalYear;
    const organizationIdParam = req.query.organizationId;
    try {
      // if (!fiscalYearParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกปีงบประมาณ",
      //     })
      //   );
      // }
      // if (!organizationIdParam) {
      //   return next(
      //     new NotFoundError({
      //       name: "กรุณาเลือกหน่วยงาน",
      //     })
      //   );
      // }
      let accountReceivableQuery = await getRepository(AccountReceivable)
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("agreement.agreementItems", "agreementItems")
        .leftJoin("accountReceivable.organization", "organization")
        .leftJoin(
          "accountReceivable.collections",
          "collection",
          "collection.active = TRUE"
        )
        .select("organization.orgName", "orgName");

      const year = +fiscalYearParam - 543;
      const lastDateOfYear = `${year}-09-30`;

      accountReceivableQuery
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect(
          `concat(agreementItems.borrower.title, agreementItems.borrower.firstname, " ", agreementItems.borrower.lastname)`,
          "borrowerName"
        )
        .addSelect(`accountReceivable.loanAmount`, "loanAmount")
        .addSelect(
          `accountReceivable.outstandingDebtBalance`,
          "outstandingDebtBalance"
        )
        // .addSelect(`accountReceivable.startDate`, "startDate")
        .addSelect(`agreement.startDate`, "startDate")
        .addSelect(
          `accountReceivable.installmentFirstDate`,
          "installmentFirstDate"
        )
        .addSelect(`accountReceivable.lastPaymentDate`, "lastPaymentDate")
        .addSelect("accountReceivable.status", "status")
        .addSelect(
          "accountReceivable.debtAcknowledgement.acknowledgeDate",
          "acknowledgeDate"
        )
        .addSelect(
          "accountReceivable.debtAcknowledgement.isAcknowledge",
          "isAcknowledge"
        )
        .addSelect(
          `
          CASE
            WHEN accountReceivable.debtAcknowledgement.isAcknowledge = TRUE AND accountReceivable.lastPaymentDate IS NOT NULL 
              THEN DATE_ADD(accountReceivable.lastPaymentDate, INTERVAL 1 DAY) 
            WHEN accountReceivable.debtAcknowledgement.isAcknowledge = TRUE AND accountReceivable.lastPaymentDate IS NULL 
              THEN DATE_ADD(accountReceivable.installmentFirstDate, INTERVAL 1 DAY) 
            WHEN accountReceivable.lastPaymentDate IS NULL
              THEN DATE_ADD(accountReceivable.installmentFirstDate, INTERVAL 1 DAY)
            WHEN accountReceivable.lastPaymentDate > accountReceivable.installmentFirstDate AND DAY(accountReceivable.lastPaymentDate) > DAY(accountReceivable.installmentFirstDate)
              THEN DATE_ADD(DATE_ADD(DATE(CONCAT(YEAR(accountReceivable.lastPaymentDate),'-', MONTH(accountReceivable.lastPaymentDate),'-', DAY(accountReceivable.installmentFirstDate))), INTERVAL 1 MONTH), INTERVAL 1 DAY)
          END
        
        `,
          "prescriptionStartDate"
        );

      accountReceivableQuery.where(
        new Brackets((qb) => {
          qb.where("collection.active = TRUE").orWhere(
            "accountReceivable.debtAcknowledgement.isAcknowledge = TRUE"
          );
        })
      );
      accountReceivableQuery.andWhere(
        "accountReceivable.status IN ('10', '20', '30')"
      );

      // ปีงบประมาณ
      if (fiscalYearParam) {
        //
        accountReceivableQuery.andWhere(
          "accountReceivable.documentDate <= :endDate",
          {
            endDate: lastDateOfYear,
          }
        );
      }

      // หน่วยงานที่รับผิดชอบ (จังหวัด)
      if (organizationIdParam) {
        //
        accountReceivableQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      const records = await accountReceivableQuery.getRawMany();
      if (!records || records.length <= 0) {
        return next(
          new NotFoundError({
            name: "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          })
        );
      } else {
        const templateData = {
          title1: `รายงานอายุความสัญญาลูกหนี้กองทุนผู้สูงอายุ
        ประจำปี ${req.query.fiscalYear || "-"} ของหน่วยงาน${
            organizationIdParam ? records[0].orgName : ""
          }`,
          // title2: `ระหว่าง ${
          //   fiscalYearParam
          //     ? getThaiPartialDate(firstDateOfYear || "") +
          //       " - " +
          //       getThaiPartialDate(lastDate || "")
          //     : "-"
          // }`,
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: records,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "DEBTREPORT8" },
          data: templateData,
        });

        const reportName = `DebtReport8${new Date().toISOString()}.xlsx`;
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

export const controller = new DebtCollectionReportController(
  "DebtCollection",
  "รายงานการติดตามหนี้สิน"
);
