import { getManager } from "typeorm";
import { NotFoundError } from "../../middlewares/error/error-type";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import { getEnumSetText } from "../../utils/get-enum-set-text";
import { jsreport } from "../../jsreport";

enum TransactionTypeSet {
  normal = "NM",
  cancel = "CL",
}
interface PaymentQuery {
  paidDate: string;
  yearMonth: string;
  startDocumentDate: string;
  endDocumentDate: string;
  organizationId: string;
}
export class KTBController {
  private reportNotFoundMessage =
    "ไม่พบข้อมูลสำหรับออกรายงาน กรุณาเลือกเงื่อนไขใหม่";

  printPaymentviaKTBReport = async (req, res, next) => {
    const query: PaymentQuery = req.query;
    const {
      paidDate,
      yearMonth,
      startDocumentDate,
      endDocumentDate,
      organizationId,
    } = query;

    const selectedString = this.prepareSelectString(TransactionTypeSet.normal);
    const { whereClause, params } = this.prepareWhereClause(query);
    const orderClause = this.prepareOrderClause();

    // // รายเดือน
    let yearMonthSplit, year, month;
    if (yearMonth) {
      yearMonthSplit = yearMonth.split("-");
      year = yearMonthSplit[0];
      month = yearMonthSplit[1];
    }

    const sql = `${selectedString} ${whereClause} ${orderClause}`;

    try {
      const raw = await getManager().query(sql, params);

      if (!raw || raw.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        let paymentTime = "";
        if (paidDate) {
          paymentTime = `เวลาที่ชำระ ณ วันที่ ${getThaiPartialDate(paidDate)}`;
        } else if (yearMonth && yearMonthSplit && yearMonthSplit.length === 2) {
          paymentTime = `เวลาที่ชำระ ประจำเดือน ${getEnumSetText(
            "monthTH",
            +month
          )}`;
        } else if (startDocumentDate && endDocumentDate) {
          paymentTime = `เวลาที่ชำระ ตั้งแต่วันที่ ${getThaiPartialDate(
            startDocumentDate
          )} ถึงวันที่ ${getThaiPartialDate(endDocumentDate)}`;
        }

        const templateData = {
          title1: `รายงานสรุปรายการชำระเงินผ่านKTB`,
          title2: organizationId ? `บัญชีลูกหนี้ของ ${raw[0].orgName}` : "",
          paymentTime: paymentTime,
          data: raw,
        };

        const resp = await jsreport.render({
          template: { name: "KTB-Report-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `PaymentviaKTBReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
        // res.send(raw);
      }
    } catch (err) {
      next(err);
    }
  };
  printCancelPaymentviaKTBReport = async (req, res, next) => {
    const query: PaymentQuery = req.query;
    const {
      paidDate,
      yearMonth,
      startDocumentDate,
      endDocumentDate,
      organizationId,
    } = query;

    const selectedString = this.prepareSelectString(TransactionTypeSet.cancel);
    const { whereClause, params } = this.prepareWhereClause(query);
    const orderClause = this.prepareOrderClause();

    // // รายเดือน
    let yearMonthSplit, year, month;
    if (yearMonth) {
      yearMonthSplit = yearMonth.split("-");
      year = yearMonthSplit[0];
      month = yearMonthSplit[1];
    }

    const sql = `${selectedString} ${whereClause} ${orderClause}`;

    try {
      const raw = await getManager().query(sql, params);

      if (!raw || raw.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        let paymentTime = "";
        if (paidDate) {
          paymentTime = `เวลาที่ชำระ ณ วันที่ ${getThaiPartialDate(paidDate)}`;
        } else if (yearMonth && yearMonthSplit && yearMonthSplit.length === 2) {
          paymentTime = `เวลาที่ชำระ ประจำเดือน ${getEnumSetText(
            "monthTH",
            +month
          )}`;
        } else if (startDocumentDate && endDocumentDate) {
          paymentTime = `เวลาที่ชำระ ตั้งแต่วันที่ ${getThaiPartialDate(
            startDocumentDate
          )} ถึงวันที่ ${getThaiPartialDate(endDocumentDate)}`;
        }

        const templateData = {
          title1: `รายงานการยกเลิกการชำระเงินผ่านKTB`,
          title2: organizationId ? `บัญชีลูกหนี้ของ ${raw[0].orgName}` : "",
          paymentTime: paymentTime,
          data: raw,
        };

        const resp = await jsreport.render({
          template: { name: "KTB-Report-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `CancelPaymentviaKTBReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (err) {
      next(err);
    }
  };
  printKTBTransactionLogReport = async (req, res, next) => {
    const query: PaymentQuery = req.query;
    const {
      paidDate,
      yearMonth,
      startDocumentDate,
      endDocumentDate,
      organizationId,
    } = query;

    const selectedString = this.prepareKTBLogSelectString(
      TransactionTypeSet.normal
    );
    const { whereClause, params } = this.prepareKTBLogWhereClause(query);
    const orderClause = this.prepareKTBLogOrderClause();

    // // รายเดือน
    let yearMonthSplit, year, month;
    if (yearMonth) {
      yearMonthSplit = yearMonth.split("-");
      year = yearMonthSplit[0];
      month = yearMonthSplit[1];
    }

    const sql = `${selectedString} ${whereClause} ${orderClause}`;

    try {
      const raw = await getManager().query(sql, params);

      if (!raw || raw.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        let paymentTime = "";
        if (paidDate) {
          paymentTime = `เวลาที่ชำระ ณ วันที่ ${getThaiPartialDate(paidDate)}`;
        } else if (yearMonth && yearMonthSplit && yearMonthSplit.length === 2) {
          paymentTime = `เวลาที่ชำระ ประจำเดือน ${getEnumSetText(
            "monthTH",
            +month
          )}`;
        } else if (startDocumentDate && endDocumentDate) {
          paymentTime = `เวลาที่ชำระ ตั้งแต่วันที่ ${getThaiPartialDate(
            startDocumentDate
          )} ถึงวันที่ ${getThaiPartialDate(endDocumentDate)}`;
        }

        const templateData = {
          title1: `รายงานสรุปรายการรับส่งข้อมูลระหว่างกรมผู้สูงอายุ และ KTB`,
          // title2: organizationId ? `บัญชีลูกหนี้ของ ${raw[0].orgName}` : "",
          title2: "",
          paymentTime: paymentTime,
          data: raw,
        };

        const resp = await jsreport.render({
          template: { name: "KTB-TransLogReport-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `KTBTransactionLogReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
        // res.send(raw);
      }
    } catch (err) {
      next(err);
    }
  };
  prepareSelectString(type: TransactionTypeSet) {
    return `
      SELECT accTrans.paidDate AS paidDate, accTrans.paidAmount AS paidAmount, accTrans.status AS status, 
        ktb.comCode AS comCode, ktb.prodCode AS prodCode, ktb.ref1 AS reference1, LPAD(agreement.id, 8, '0') AS reference2,
        ktb.bankCode AS bankCode, accTrans.paymentReferenceNo AS bankRef, ktb.channel AS channel, accountReceivable.name AS name, 
        agreement.fiscalYear AS fiscalYear, agreement.documentNumber AS documentNumber, organization.orgName AS orgName, 
        organization.orgCode AS orgCode, organization.addressProvince AS addressProvince 
      FROM account_receivable_transactions accTrans 
        INNER JOIN ktb_direct_link ktb ON ktb.id = accTrans.paymentId  
        INNER JOIN account_receivables accountReceivable ON accountReceivable.id = accTrans.accountReceivableId  
        INNER JOIN agreements agreement ON accountReceivable.agreementId = agreement.id  
        INNER JOIN organizations organization ON organization.id = accountReceivable.organizationId 
      AND accTrans.paymentType = "KTB" 
      AND accTrans.status = "${type}"
    
    `;
  }
  prepareKTBLogSelectString(type: TransactionTypeSet) {
    return `
      SELECT  ktb.id AS id, ktb.createdDate AS createdDate, ktb.type AS type, ktb.user AS user, ktb.password AS password,
        ktb.comCode AS comCode, ktb.prodCode AS prodCode, ktb.command AS command, ktb.bankCode AS bankCode,
        ktb.bankRef AS bankRef, ktb.dateTime AS dateTime, ktb.effDate AS effDate, ktb.channel AS channel,
        ktb.ref1 AS ref1, ktb.ref2 AS ref2, ktb.ref3 AS ref3, ktb.ref4 AS ref4, ktb.tranxId AS tranxId, ktb.amount AS amount,
        ktb.cusName AS cusName, ktb.respCode AS respCode, ktb.respMsg AS respMsg, ktb.balance AS balance, ktb.print1 AS print1,
        ktb.print2 AS print2, ktb.print3 AS print3, ktb.print4 AS print4, ktb.print5 AS print5, ktb.print6 AS print6,
        ktb.print7 AS print7, ktb.info AS info
      FROM ktb_direct_link ktb 
    `;
  }
  prepareOrderClause() {
    return "ORDER BY accTrans.paidDate ASC, organization.orgCode ASC";
  }
  prepareKTBLogOrderClause() {
    return "";
  }
  prepareWhereClause(query: PaymentQuery) {
    const {
      paidDate,
      yearMonth,
      startDocumentDate,
      endDocumentDate,
      organizationId,
    } = query;

    let whereClause = "";
    let isFirst = true;
    const params = [];

    // รายวัน
    if (paidDate) {
      whereClause = `${whereClause} ${
        isFirst === true ? "WHERE" : "AND"
      } DATE(accTrans.paidDate) = ?`;
      params.push(paidDate);
      isFirst = false;
    }

    // รายเดือน
    const { yearMonthSplit, year, month } = this.splitYearMonth(yearMonth);
    if (yearMonth && yearMonthSplit && yearMonthSplit.length === 2) {
      whereClause = `${whereClause} ${
        isFirst === true ? "WHERE" : "AND"
      } YEAR(accTrans.paidDate) = ? AND MONTH(accTrans.paidDate) = ?`;
      params.push(year, month);
      isFirst = false;
    }

    // ช่วงเวลา
    if (startDocumentDate || endDocumentDate) {
      whereClause = `${whereClause} ${
        isFirst === true ? "WHERE" : "AND"
      } accTrans.paidDate BETWEEN ? AND ?`;
      params.push(startDocumentDate, endDocumentDate);
      isFirst = false;
    }
    // หน่วยงาน
    if (organizationId) {
      whereClause = `${whereClause} ${
        isFirst === true ? "WHERE" : "AND"
      } organization.id = ?`;
      params.push(organizationId);
      isFirst = false;
    }

    return { whereClause, params };
  }
  prepareKTBLogWhereClause(query: any) {
    const {
      paidDate,
      yearMonth,
      startDocumentDate,
      endDocumentDate,
      organizationId,
    } = query;

    let whereClause = "";
    let isFirst = true;
    const params = [];

    // รายวัน
    if (paidDate) {
      whereClause = `${whereClause} ${
        isFirst === true ? "WHERE" : "AND"
      } DATE(ktb.createdDate) = ?`;
      params.push(paidDate);
      isFirst = false;
    }

    // รายเดือน
    const { yearMonthSplit, year, month } = this.splitYearMonth(yearMonth);
    if (yearMonth && yearMonthSplit && yearMonthSplit.length === 2) {
      whereClause = `${whereClause} ${
        isFirst === true ? "WHERE" : "AND"
      } YEAR(ktb.createdDate) = ? AND MONTH(ktb.createdDate) = ?`;
      params.push(year, month);
      isFirst = false;
    }

    // ช่วงเวลา
    if (startDocumentDate || endDocumentDate) {
      whereClause = `${whereClause} ${
        isFirst === true ? "WHERE" : "AND"
      } ktb.createdDate BETWEEN ? AND ?`;
      params.push(startDocumentDate, endDocumentDate);
      isFirst = false;
    }

    return { whereClause, params };
  }
  splitYearMonth(yearMonth: string) {
    let yearMonthSplit, year, month;

    if (yearMonth) {
      yearMonthSplit = yearMonth.split("-");
      year = yearMonthSplit[0];
      month = yearMonthSplit[1];
    }

    return { yearMonthSplit, year, month };
  }
}
