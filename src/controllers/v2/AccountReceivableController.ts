import moment = require("moment");
import { DeepPartial, getRepository, Brackets } from "typeorm";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { EmbeddedDebtAcknowledgement } from "../../entities/embedded/EmbeddedDebtAcknowledgement";
import {
  accountReceiviableStatusSet,
  agreementStatusSet,
  arTransactionStatusSet,
  debtInterruptReasonSet,
  paymentMethodSet,
  paymentTypeSet,
} from "../../enumset";
import { jsreport } from "../../jsreport";
import { NotFoundError } from "../../middlewares/error/error-type";
import AccountReceivableRepository, {
  IAccountReceivableFilter,
  IDebtCollectionFilter,
} from "../../repositories/v2/AccountReceivableRepository";
import AccountReceivableTransactionRepository from "../../repositories/v2/AccountReceivableTransactionRepository";
import { getFiscalYear, getThaiPartialDate } from "../../utils/datetime-helper";
import { getEnumSetList, IItemSet } from "../../utils/get-enum-set-text";
import { flattenObject } from "../../utils/object-helper";
import { addSelectRegion } from "../queries-utils/organization-queries";
import { BaseController } from "./BaseController";
import {
  addSelectTotalPaidByMonth,
  addSelectTotalPaidByMonthByPaymentType,
  addSelectTotalPaidAllMonthByPaymentType,
  addSelectSubQueryTotalLoanAmount,
  addWhereReport2489,
  addWhereReport9,
  addSelectTotalPaidAllMonth,
  addSelectOutstandingDebtBalance,
} from "../queries-utils/accountReceivable-queries";
import { Agreement } from "../../entities/Agreement";
import { generateBarcode } from "../../utils/barcode-helper";

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

class AccountReceivableController extends BaseController {
  private reportNotFoundMessage =
    "ไม่พบข้อมูลสำหรับออกรายงาน กรุณาเลือกเงื่อนไขใหม่";

  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  withFormData = (req, res, next) => {
    if (req.body.debtAcknowledgement) {
      req.body.debtAcknowledgement.isAcknowledge = req.body.debtAcknowledgement
        .isAcknowledge
        ? true
        : false;
      req.body.debtAcknowledgement.isBehalf = req.body.debtAcknowledgement
        .isBehalf
        ? true
        : false;
      req.body.debtAcknowledgement.isOnlyBirthYear = req.body
        .debtAcknowledgement.isOnlyBirthYear
        ? true
        : false;
    }

    next();
  };

  getAccountReceivable = async (req, res, next) => {
    try {
      const entity = await AccountReceivableRepository.findAccountReceivable(
        req.params.id,
        {
          relations: [
            "organization",
            "transactions",
            "agreement",
            "agreement.agreementItems",
            "agreement.request",
            "agreement.request.requestItems",
            "guarantee",
            "guarantee.guaranteeItems",
            // "controls"
          ],
        }
      );

      res.locals.data = entity;

      next();
    } catch (err) {
      next(err);
    }
  };

  getAccountReceivables = async (req, res, next) => {
    const {
      documentNumber,
      permittedOrganizationIds,
      agreementType,
      firstname,
      lastname,
      idCardNo,
      guarantorIdCardNo,
      guarantorFirstname,
      guarantorLastname,
      status,
      name,
      startDate,
      endDate,
      fiscalYear,
    } = req.query as IAccountReceivableFilter;

    const { currentPage = 1, perPage = 10 } = req.query;

    try {
      const [
        entities,
        total,
      ] = await AccountReceivableRepository.findAccountReceivablesAndCount(
        {
          documentNumber,
          permittedOrganizationIds,
          agreementType,
          firstname,
          lastname,
          idCardNo,
          guarantorIdCardNo,
          guarantorFirstname,
          guarantorLastname,
          status,
          name,
          startDate,
          endDate,
          fiscalYear,
        },
        { currentPage, perPage }
      );

      res.locals.data = entities;
      res.locals.total = total;

      next();
    } catch (err) {
      next(err);
    }
  };

  getAccountReceivablesWithDebtCollection = async (req, res, next) => {
    const {
      arDocumentNumber,
      permittedOrganizationIds,
      agreementType,
      prescriptionRemainingStartDate,
      prescriptionRemainingEndDate,
      step,
      firstname,
      lastname,
      idCardNo,
      noPaymentStart,
      noPaymentEnd,
      asOfYearMonth,
      creditStatus,
      deathNotification,
      status,
    } = req.query as IDebtCollectionFilter;

    const { currentPage = 1, perPage = 10 } = req.query;

    try {
      const [
        entities,
        total,
      ] = await AccountReceivableRepository.findAccountReceivablesWithDebtCollectionAndCount(
        {
          arDocumentNumber,
          permittedOrganizationIds,
          agreementType,
          prescriptionRemainingStartDate,
          prescriptionRemainingEndDate,
          step,
          firstname,
          lastname,
          idCardNo,
          noPaymentStart,
          noPaymentEnd,
          asOfYearMonth,
          creditStatus,
          deathNotification,
          status,
        },
        { currentPage, perPage }
      );

      res.locals.data = entities;
      res.locals.total = total;

      next();
    } catch (err) {
      next(err);
    }
  };

  updateAccountReceivable = async (req, res, next) => {
    try {
      const accountReceivable = await AccountReceivableRepository.findAccountReceivable(
        req.params.id,
        {
          relations: [
            "organization",
            "transactions",
            "agreement",
            "agreement.agreementItems",
            "agreement.request",
            "agreement.request.requestItems",
            "guarantee",
            "guarantee.guaranteeItems",
          ],
        }
      );

      AccountReceivableRepository.merge(accountReceivable, req.body);

      // กรณีปิดบัญชี
      const closeStatus = [
        accountReceiviableStatusSet.close,
        accountReceiviableStatusSet.badDebt,
      ];

      if (closeStatus.includes(accountReceivable.status)) {
        let transaction: AccountReceivableTransaction;
        const today = new Date();

        const { agreement } = accountReceivable;

        // ปิดสัญญากู้
        agreement.closeDate = today;
        agreement.status = agreementStatusSet.close;

        // กรณีปิดบัญชีแบบธรรมดาต้องสร้าง transaction และปรับปรุง outstandingDebtBalance
        if (
          accountReceivable.status === accountReceiviableStatusSet.close &&
          +accountReceivable.outstandingDebtBalance !== 0.0
        ) {
          transaction = AccountReceivableTransactionRepository.create({
            accountReceivableId: accountReceivable.id,
            paymentType: paymentTypeSet.system,
            paymentMethod: paymentMethodSet.notDeclare,
            paidDate: today,
            paidAmount: accountReceivable.outstandingDebtBalance,
            outstandingDebtBalance: 0.0,
            status: arTransactionStatusSet.adjust,
          });

          accountReceivable.outstandingDebtBalance = 0.0;
        }

        if (req.body.comments) {
          accountReceivable.comments = req.body.comments;
        }

        // actionLog
        accountReceivable.logUpdatedBy(req.body);
        agreement.logUpdatedBy(req.body);
        transaction.logCreatedBy(req.body);

        await AccountReceivableRepository.closeAccountReceivable(
          accountReceivable,
          agreement,
          transaction
        );
      } else {
        // actionLog
        accountReceivable.logUpdatedBy(req.body);

        await AccountReceivableRepository.updateAccountReceivable(
          accountReceivable
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  updateAcknowledge = async (req, res, next) => {
    const {
      debtAcknowledgement,
      updatedBy,
      updatedByName,
    } = req.body as IUAcknowledge;
    try {
      const atfs: any[] = [];
      flattenObject(req.body, "attachedFiles", true, atfs);

      const accountReceivable = await AccountReceivableRepository.findOne(
        req.params.id
      );

      accountReceivable.debtAcknowledgement = debtAcknowledgement;
      accountReceivable.updatedBy = updatedBy;
      accountReceivable.updatedByName = updatedByName;

      await AccountReceivableRepository.updateAccountReceivable(
        accountReceivable,
        undefined,
        undefined,
        atfs
      );

      next();
    } catch (err) {
      next(err);
    }
  };

  onAcknowledge = async (req, res, next) => {
    // const { debtAcknowledgement, ...rest } = req.body as AccountReceivable;
    const {
      debtAcknowledgement,
      accountReceivable,
      createdBy,
      createdByName,
    } = req.body as IOnAcknowledge;

    try {
      const atfs: any[] = [];
      flattenObject(req.body, "attachedFiles", true, atfs);

      const oldAccountReceivable = await AccountReceivableRepository.findAccountReceivable(
        req.params.id,
        {
          relations: ["transactions"],
        }
      );

      let newAccountReceivable: AccountReceivable;

      const { collection } = oldAccountReceivable;
      // ปิด DebtCollection
      collection.interruptData(debtInterruptReasonSet.ackOfDebt);

      // ปิด AccountReceivable
      oldAccountReceivable.status = accountReceiviableStatusSet.close;

      const ar = AccountReceivableRepository.create(accountReceivable);

      // เปิด New AccountReceivable
      newAccountReceivable = AccountReceivableRepository.create(
        this.prepareNewAR(
          oldAccountReceivable,
          ar,
          debtAcknowledgement,
          createdBy,
          createdByName
        )
      );

      // actionLog
      oldAccountReceivable.logUpdatedBy(req.body);
      collection.logUpdatedBy(req.body);

      await AccountReceivableRepository.updateAccountReceivable(
        oldAccountReceivable,
        collection,
        newAccountReceivable,
        atfs
      );

      req.params.id = newAccountReceivable.id;

      next();
    } catch (err) {
      next(err);
    }
  };

  prepareNewAR = (
    oldAr: AccountReceivable,
    ar: AccountReceivable,
    debtAcknowledgement: EmbeddedDebtAcknowledgement,
    createdBy: number,
    createdByName
    // body: any
  ): DeepPartial<AccountReceivable> => {
    const documentNumber = this.getNewDocumentNumber(oldAr.documentNumber);
    // const { debtAcknowledgement, accountReceivable } = body;
    return {
      organizationId: oldAr.organizationId,
      // refReportCode: oldAr.refReportCode,
      // fiscalYear: oldAr.fiscalYear,
      fiscalYear: getFiscalYear(
        debtAcknowledgement.acknowledgeDate as Date
      ).toString(),
      agreementId: oldAr.agreementId,
      guaranteeId: oldAr.guaranteeId,
      documentDate: debtAcknowledgement.acknowledgeDate,
      documentNumber,
      // internalRef: oldAr.internalRef,
      status: accountReceiviableStatusSet.normal,
      startDate: ar.installmentFirstDate,
      endDate: ar.installmentLastDate,
      // closeDate: ar.closeDate, // ???
      name: oldAr.name,
      loanAmount: debtAcknowledgement.debtAmount,
      loanDurationYear: ar.getDurationYear(),
      loanDurationMonth: ar.getDurationMonth(),
      installmentAmount: ar.installmentAmount,
      installmentLastAmount: ar.installmentLastAmount,
      installmentPeriodValue: ar.installmentPeriodValue,
      installmentPeriodUnit: ar.installmentPeriodUnit,
      installmentPeriodDay: ar.installmentPeriodDay,
      installmentTimes: ar.installmentTimes,
      installmentFirstDate: ar.installmentFirstDate,
      installmentLastDate: ar.installmentLastDate,
      borrowerContactAddress: oldAr.borrowerContactAddress,
      borrowerContactTelephone: oldAr.borrowerContactTelephone,
      guarantorContactAddress: oldAr.guarantorContactAddress,
      guarantorContactTelephone: oldAr.guarantorContactTelephone,
      // transactions: AccountReceivableTransaction[];
      // collections: DebtCollection[];
      debtAcknowledgement: {
        ...debtAcknowledgement,
        preAccountReceivableId: oldAr.id,
        preAccountReceivableDocumentNumber: oldAr.documentNumber,
        preDebtCollectionId: oldAr.collection.id,
      },
      // controls: AccountReceivableControl[];
      // lastPaymentDate: Date | string;
      tentativeOverdueDate: ar.installmentFirstDate,
      outstandingDebtBalance: debtAcknowledgement.debtAmount,
      createdBy,
      createdByName,
    };
  };

  getNewDocumentNumber = (currentDocumentNumber: string) => {
    let suffix = "";
    const splits = currentDocumentNumber.split("-");
    if (splits.length > 1) {
      suffix = `${+splits.pop() + 1}`.padStart(2, "0");
      splits.push(suffix);
      return splits.join("-");
    }
    splits.push("02");
    return splits.join("-");
  };

  printAr = async (req, res, next) => {
    try {
      const data = await AccountReceivableRepository.findOne(req.params.id, {
        relations: [
          "agreement",
          "agreement.request",
          "agreement.request.requestItems",
          "agreement.agreementItems",
          "guarantee",
          "guarantee.guaranteeItems",
          "organization",
        ],
      });

      const { agreement, guarantee, ...rest } = data;
      const idCardNo = agreement.agreementItems[0].borrower.idCardNo;
      agreement.setThaiFormatForReport();
      guarantee.setThaiFormatForReport();
      const { agreementItems, request, ...agRest } = agreement;
      const { guaranteeItems, ...guRest } = guarantee;
      const { requestItems, ...reRest } = request;

      // const cr = os.EOL;
      const cr = "\r";
      const text = `|${process.env.TAX_ID}${
        process.env.SERVICE_NO
      }${cr}${idCardNo}${cr}${agreement.id.toString().padStart(8, "0")}${cr}${
        +agreement.installmentAmount * 100
      }`;
      const barcode = await generateBarcode(text);

      const resp = await jsreport.render({
        template: { name: "ar-page" },
        data: {
          ...rest,
          agreement: {
            ...agRest,
            ...agreementItems[0],
            request: { ...reRest, ...requestItems[0] },
          },
          agreement_id:agreement.id.toString().padStart(8, "0"),
          guarantee: { ...guRest, ...guaranteeItems[0] },
          barcode,
        },
      });

      const filename = `ar${new Date().toISOString()}.pdf`;

      res
        .header("Content-Disposition", `attachment; filename=${filename}`)
        .header("filename", filename)
        .send(resp.content);
    } catch (e) {
      next(e);
    }
  };

  // Report 14
  public printPaymentReport = async (req, res, next) => {
    try {
      const startPaidDateParam = req.query.startPaidDate;
      const endPaidDateParam = req.query.endPaidDate;
      const fiscalYearParam = req.query.fiscalYear;

      let accountReceivableTransactionQuery = await getRepository(
        AccountReceivableTransaction
      )
        .createQueryBuilder("accRecTrans")
        .leftJoin("accRecTrans.accountReceivable", "accountReceivable")
        .leftJoin("accountReceivable.organization", "organization")
        .select("organization.orgName", "orgName");
      accountReceivableTransactionQuery = addSelectRegion(
        accountReceivableTransactionQuery
      );

      // accountReceivableTransactionQuery.addSelect(
      //   "accRecTrans.paymentType",
      //   "paymentType"
      // );

      if (!fiscalYearParam) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      }

      const year = +fiscalYearParam - 543;
      const prevYear = year - 1;
      const firstDateOfYear = `${prevYear}-10-01`;
      const lastDateOfYear = `${year}-09-30`;

      const paymentTypes = getEnumSetList("paymentType");
      const paymentTypeArrayString = paymentTypes
        .map((item) => `'${item.value}'`)
        .join(",");
      paymentTypes.forEach((payment: IItemSet) => {
        // 12 month paid
        getEnumSetList("monthEN").forEach((item: IItemSet, index: number) => {
          const monthIndex = index + 1;
          let isMinus = [10, 11, 12].includes(monthIndex);
          let oneOrZero = isMinus ? 1 : 0;
          accountReceivableTransactionQuery.addSelect(
            `SUM(IF(MONTH(accRecTrans.paidDate) = ${monthIndex} AND YEAR(accRecTrans.paidDate) = ${
              fiscalYearParam - 543 - oneOrZero
              // fiscalYearParam - 1
            } AND accRecTrans.paymentType = '${
              payment.value
            }'  , accRecTrans.paidAmount, 0))`,
            `totalPaid${item.text}${payment.value}`
          );
        });
      });
      getEnumSetList("monthEN").forEach((item: IItemSet, index: number) => {
        const monthIndex = index + 1;
        let isMinus = [10, 11, 12].includes(monthIndex);
        let oneOrZero = isMinus ? 1 : 0;
        accountReceivableTransactionQuery.addSelect(
          `SUM(IF(MONTH(accRecTrans.paidDate) = ${monthIndex} AND YEAR(accRecTrans.paidDate) = ${
            fiscalYearParam - 543 - oneOrZero
            // fiscalYearParam - 1
          } AND accRecTrans.paymentType NOT IN (${paymentTypeArrayString})  , accRecTrans.paidAmount, 0))`,
          `totalPaid${item.text}SYSTEM`
        );
      });
      getEnumSetList("monthEN").forEach((item: IItemSet, index: number) => {
        const monthIndex = index + 1;
        let isMinus = [10, 11, 12].includes(monthIndex);
        let oneOrZero = isMinus ? 1 : 0;
        accountReceivableTransactionQuery.addSelect(
          `SUM(IF(MONTH(accRecTrans.paidDate) = ${monthIndex} AND YEAR(accRecTrans.paidDate) = ${
            fiscalYearParam - 543 - oneOrZero
          }, accRecTrans.paidAmount, 0))`,
          `totalPaid${item.text}`
        );
      });

      paymentTypes.forEach((payment: IItemSet) => {
        // 12 month paid
        // getEnumSetList("monthEN").forEach((item: IItemSet, index: number) => {
        // const monthIndex = index + 1;
        // let isMinus = [10, 11, 12].includes(monthIndex);
        // let oneOrZero = isMinus ? 1 : 0;
        // accountReceivableQuery.addSelect(
        //   `SUM(IF(MONTH(accTrans.paidDate) = ${monthIndex} AND YEAR(accTrans.paidDate) = ${
        //     fiscalYearParam - 543 - oneOrZero
        //     // fiscalYearParam - 1
        //   } AND accTrans.paymentType = '${
        //     payment.value
        //   }'  , accTrans.paidAmount, 0))`,
        //   `totalPaid${item.text}${payment.value}`
        // );
        // });
        accountReceivableTransactionQuery.addSelect(
          `@totalPaidAllMonth := SUM(IF(DATE(accRecTrans.paidDate) >= concat(${
            fiscalYearParam - 543 - 1
          }, "-10-01") AND DATE(accRecTrans.paidDate) <=  concat(${
            fiscalYearParam - 543
          }, "-09-30") AND accRecTrans.paymentType = '${
            payment.value
          }', accRecTrans.paidAmount, 0))`,
          `totalPaidAllMonth${payment.value}`
        );
        accountReceivableTransactionQuery.addSelect(
          `@totalPaidAllMonthSYSTEM := SUM(IF(DATE(accRecTrans.paidDate) >= concat(${
            fiscalYearParam - 543 - 1
          }, "-10-01") AND DATE(accRecTrans.paidDate) <=  concat(${
            fiscalYearParam - 543
          }, "-09-30") AND accRecTrans.paymentType NOT IN (${paymentTypeArrayString}), accRecTrans.paidAmount, 0))`,
          `totalPaidAllMonthSYSTEM`
        );
        // accountReceivableTransactionQuery.addSelect(
        //   `SUM(IF(MONTH(accRecTrans.paidDate) = ${monthIndex} AND YEAR(accRecTrans.paidDate) = ${
        //     fiscalYearParam - 543 - oneOrZero
        //     // fiscalYearParam - 1
        //   } AND accRecTrans.paymentType NOT IN (${paymentTypeArrayString})  , accRecTrans.paidAmount, 0))`,
        //   `totalPaidAllMonth${item.text}SYSTEM`
        // );
      });
      // getEnumSetList("monthEN").forEach((item: IItemSet, index: number) => {
      //   const monthIndex = index + 1;
      //   let isMinus = [10, 11, 12].includes(monthIndex);
      //   let oneOrZero = isMinus ? 1 : 0;
      //   accountReceivableTransactionQuery.addSelect(
      //     `SUM(IF(MONTH(accRecTrans.paidDate) = ${monthIndex} AND YEAR(accRecTrans.paidDate) = ${
      //       fiscalYearParam - 543 - oneOrZero
      //       // fiscalYearParam - 1
      //     } AND accRecTrans.paymentType NOT IN (${paymentTypeArrayString})  , accRecTrans.paidAmount, 0))`,
      //     `totalPaidAllMonth${item.text}SYSTEM`
      //   );
      // });
      accountReceivableTransactionQuery.addSelect(
        `SUM(accRecTrans.paidAmount)`,
        `totalPaidAllMonth`
      );
      if (fiscalYearParam) {
        accountReceivableTransactionQuery.andWhere(
          "accRecTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: firstDateOfYear,
            endDocumentDate: lastDateOfYear,
          }
        );
      }
      if (startPaidDateParam && endPaidDateParam) {
        accountReceivableTransactionQuery.andWhere(
          "accRecTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: startPaidDateParam,
            endDocumentDate: endPaidDateParam,
          }
        );
      }

      const accountReceivableTransaction = await accountReceivableTransactionQuery
        .groupBy("organization.region")
        .addGroupBy("organization.orgName")
        // .addGroupBy(`accRecTrans.paymentType`)
        .getRawMany();

      // res.send(accountReceivableTransaction);
      if (
        !accountReceivableTransaction ||
        accountReceivableTransaction.length <= 0
      ) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const firstDate = startPaidDateParam
          ? startPaidDateParam
          : firstDateOfYear;
        const lastDate = endPaidDateParam ? endPaidDateParam : lastDateOfYear;
        const templateData = {
          title1: `รายงานการชำระเงินโดยภาพรวมและตามช่องทางต่างๆ`,
          title2: `ในช่วง ${
            firstDate && lastDate
              ? getThaiPartialDate(firstDate) +
                " - " +
                getThaiPartialDate(lastDate)
              : "-"
          }`,
          fiscalYear: fiscalYearParam,
          reportDataDate:
            "ข้อมูล ณ วันที่ " + getThaiPartialDate(moment().format()),
          data: accountReceivableTransaction,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          // template: { name: "REPORT14" },
          template: { name: "REPORT14-xlsx-recipe2" },
          data: templateData,
        });

        const reportName = `PaymentReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // Report 9
  public printPersonalRequestByProvinceReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const organizationIdParam = req.query.organizationId;
      const monthParam = req.query.month;
      const lastDate = `${fiscalYearParam - 543}-09-30`;

      if (!fiscalYearParam) {
        return next(
          new NotFoundError({
            name: "กรุณาเลือกปีงบประมาณ",
          })
        );
      }
      if (!organizationIdParam)
        return next(
          new NotFoundError({
            name: "กรุณาเลือกหน่วยงาน",
          })
        );

      // let accountReceivableQuery = await getRepository(
      //   AccountReceivableTransaction
      // )
      //   .createQueryBuilder("accTrans")
      //   .innerJoin("accTrans.accountReceivable", "accountReceivable")
      //   .innerJoin("accountReceivable.agreement", "agreement")
      let accountReceivableQuery = await getRepository(AccountReceivable)
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("accountReceivable.transactions", "accTrans")

        .innerJoin("agreement.agreementItems", "agreementItems")
        .innerJoin("accountReceivable.organization", "organization")

        .select("organization.orgName", "orgName")
        .addSelect("agreement.documentNumber", "documentNumber")
        .addSelect(
          `concat(agreementItems.borrower.title, agreementItems.borrower.firstname, " ", agreementItems.borrower.lastname)`,
          "borrowerName"
        )
        .addSelect("agreementItems.borrower.idCardNo", "borrowerIdCardNo")
        .addSelect(
          `concat(agreementItems.guarantor.title, agreementItems.guarantor.firstname, " ", agreementItems.guarantor.lastname)`,
          "guarantorName"
        )
        .addSelect("agreementItems.guarantor.idCardNo", "guarantorIdCardNo")
        .addSelect("agreement.loanAmount", "loanAmount")
        // .addSelect("accountReceivable.loanAmount", "loanAmount")
        .addSelect("agreement.installmentAmount", "installmentAmount")
        .addSelect(
          // `accountReceivable.loanAmount - SUM(IF(DATE(accTrans.paidDate) < "${
          `agreement.loanAmount - SUM(IF(DATE(accTrans.paidDate) < "${
            fiscalYearParam - 543 - 1
          }-10-01", accTrans.paidAmount, 0))`,
          `broughtForward`
        );
      // .addSelect(`accTrans.paymentType`, `paymentType`);

      addSelectTotalPaidByMonth(accountReceivableQuery, fiscalYearParam);
      addSelectTotalPaidByMonthByPaymentType(
        accountReceivableQuery,
        fiscalYearParam
      );
      addSelectTotalPaidAllMonthByPaymentType(
        accountReceivableQuery,
        fiscalYearParam
      );
      addSelectTotalPaidAllMonth(accountReceivableQuery, fiscalYearParam);
      addSelectOutstandingDebtBalance(accountReceivableQuery, fiscalYearParam);

      // Agreement details
      accountReceivableQuery = accountReceivableQuery
        .addSelect("agreement.documentDate", "documentDate")
        .addSelect("agreement.startDate", "startDate")
        .addSelect("agreement.endDate", "endDate")
        // .addSelect("accountReceivable.endDate", "endDate")
        .addSelect("agreement.installmentTimes", "installmentTimes")
        .addSelect("agreement.installmentPeriodValue", "installmentPeriodValue")
        .addSelect("agreement.installmentLastAmount", "installmentLastAmount");

      // accTrans
      accountReceivableQuery
        .addSelect((subQuery) => {
          return subQuery
            .addSelect(`MAX(accTrans1.paidDate)`, `lastPaidDate`)
            .from(AccountReceivableTransaction, "accTrans1")
            .innerJoin("accTrans1.accountReceivable", "accountReceivable1")
            .where("accountReceivable1.agreementId = agreement.id")
            .andWhere(`accTrans1.paidDate <= :lastDate`, { lastDate });
        }, `lastPaidDate`)
        // .addSelect(
        //   // `@current := DATE_ADD(CURDATE() , INTERVAL -1 DAY)`,
        //   `@current := DATE_ADD("${
        //     fiscalYearParam - 543
        //   }-09-30" , INTERVAL -1 DAY)`,
        //   `currentDate`
        // )
        .addSelect(
          // `@currentExpectedPaidTimes := TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.endDate  > @current ,@current ,agreement.installmentLastDate ))+1`,
          `@currentExpectedPaidTimes := TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.installmentLastDate  > '${
            fiscalYearParam - 543
          }-09-30','${
            fiscalYearParam - 543
          }-09-30' ,agreement.installmentLastDate ))+1`,
          `installmentsTimesDue`
        )
        .addSelect(
          `@currentTempExpectedPaidAmount := @currentExpectedPaidTimes * agreement.installmentAmount`,
          `currentTempExpectedPaidAmount`
        )
        .addSelect(
          `@currentExpectedPaidAmount := IF(@currentTempExpectedPaidAmount > agreement.loanAmount, agreement.loanAmount , @currentTempExpectedPaidAmount)`,
          `installmentsAmountDue`
        );
      // .addSelect(
      //   `@tempPaidAmount  := (SELECT sum(trans.paidAmount)
      //   FROM account_receivable_transactions as trans
      //     where trans.paidDate <= @current and trans.accountReceivableId = accountReceivable.id
      //   )`,
      //   `tempPaidAmount`
      // )
      // .addSelect(
      //   `@paidAmount := CAST(IF(ISNULL(@tempPaidAmount), 0, @tempPaidAmount) as decimal(10,2))`,
      //   `paidAmount`
      // )
      // .addSelect(
      //   `@currentOverdueBalance := @currentExpectedPaidAmount - @paidAmount`,
      //   `installmentsTimesOverDue`
      // )
      // .addSelect(
      //   `IF(@currentOverdueBalance  > 0 ,CEILING(@currentOverdueBalance / agreement.installmentAmount) ,0)`,
      //   `installmentsAmountOverDue`
      // );

      addWhereReport2489(accountReceivableQuery, {
        fiscalYearParam,
        monthParam,
        organizationIdParam,
        lastDate,
      });
      addWhereReport9(accountReceivableQuery);

      const accountReceivable = await await accountReceivableQuery
        // .groupBy("accountReceivable.id")
        .groupBy("agreement.id")
        .addGroupBy("organization.orgName")
        .addGroupBy("agreement.documentNumber")
        .addGroupBy("agreementItems.borrower.idCardNo")
        .addGroupBy("agreementItems.borrowerTitle")
        .addGroupBy("agreementItems.borrowerFirstname")
        .addGroupBy("agreementItems.borrowerLastname")
        .addGroupBy("agreementItems.guarantor.idCardNo")
        .addGroupBy("agreementItems.guarantor.title")
        .addGroupBy("agreementItems.guarantor.firstname")
        .addGroupBy("agreementItems.guarantor.lastname")
        .addGroupBy("agreement.loanAmount")
        .addGroupBy("agreement.InstallmentAmount")
        // .addGroupBy("accTrans.paymentType")
        // .addGroupBy("accountReceivable.outstandingDebtBalance")
        .addGroupBy("agreement.documentDate")
        .addGroupBy("agreement.startDate")
        .addGroupBy("agreement.endDate")
        .addGroupBy("agreement.installmentTimes")
        .addGroupBy("agreement.installmentLastAmount")
        .orderBy("agreement.id")
        .getRawMany();

      // res.send(accountReceivable);

      if (!accountReceivable || accountReceivable.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          title1: `รายงานรายละเอียดการกู้ยืมเงินทุนประกอบอาชีพประเภทรายบุคคล ${
            organizationIdParam
              ? "ของหน่วยงาน" + accountReceivable[0].orgName
              : ""
          }`,
          title2: `ประจำปีงบประมาณ ${fiscalYearParam || ""}`,
          fiscalYear: fiscalYearParam || "-",
          // reportDataDate: getThaiPartialDate(moment().format()),
          reportDataDate:
            "ข้อมูล ณ วันที่ " +
            getThaiPartialDate(`${fiscalYearParam - 543}-09-30`),
          data: accountReceivable,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT2-4-8-9-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `PersonalRequestByProvinceReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // Report 2
  public printAccountRecievableReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const regionParam = req.query.region;
      const organizationIdParam = req.query.organizationId;
      const lastDate = `${fiscalYearParam - 543}-09-30`;

      if (!fiscalYearParam) {
        return next(
          new NotFoundError({
            name: "กรุณาเลือกปีงบประมาณ",
          })
        );
      }
      if (!regionParam) {
        if (!organizationIdParam)
          return next(
            new NotFoundError({
              name: "กรุณาเลือกภาคหรือหน่วยงาน",
            })
          );
      }
      if (!organizationIdParam) {
        if (!regionParam)
          return next(
            new NotFoundError({
              name: "กรุณาเลือกภาคหรือหน่วยงาน",
            })
          );
      }

      let accountReceivableQuery = await getRepository(AccountReceivable)
        // .createQueryBuilder("accTrans")
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.transactions", "accTrans")
        .leftJoin("accountReceivable.agreement", "agreement")
        .leftJoin("agreement.agreementItems", "agreementItems")
        .leftJoin("accountReceivable.organization", "organization")

        .select("agreement.documentNumber", "documentNumber")
        .addSelect(
          `concat(agreementItems.borrower.title, agreementItems.borrower.firstname, " ", agreementItems.borrower.lastname)`,
          "borrowerName"
        )
        .addSelect("agreementItems.borrower.idCardNo", "borrowerIdCardNo")
        .addSelect(
          `concat(agreementItems.guarantor.title, agreementItems.guarantor.firstname, " ", agreementItems.guarantor.lastname)`,
          "guarantorName"
        )
        .addSelect("agreementItems.guarantor.idCardNo", "guarantorIdCardNo")
        .addSelect("agreement.loanAmount", "loanAmount")
        .addSelect("agreement.installmentAmount", "installmentAmount")
        // .addSelect(
        //   `SUM(IF(DATE(accTrans.paidDate) < "${
        //     fiscalYearParam - 1
        //   }-10-01", accTrans.paidAmount, 0))`,
        //   `broughtForward`
        // )
        .addSelect(
          // `accountReceivable.loanAmount - SUM(IF(DATE(accTrans.paidDate) < "${
          `agreement.loanAmount - SUM(IF(DATE(accTrans.paidDate) < "${
            fiscalYearParam - 543 - 1
          }-10-01", accTrans.paidAmount, 0))`,
          `broughtForward`
        );
      // .addSelect(`accTrans.paymentType`, `paymentType`);

      addSelectTotalPaidByMonth(accountReceivableQuery, fiscalYearParam);
      addSelectTotalPaidByMonthByPaymentType(
        accountReceivableQuery,
        fiscalYearParam
      );
      addSelectTotalPaidAllMonthByPaymentType(
        accountReceivableQuery,
        fiscalYearParam
      );
      addSelectTotalPaidAllMonth(accountReceivableQuery, fiscalYearParam);
      addSelectOutstandingDebtBalance(accountReceivableQuery, fiscalYearParam);

      // Agreement details
      accountReceivableQuery = accountReceivableQuery
        .addSelect("agreement.documentDate", "documentDate")
        .addSelect("agreement.startDate", "startDate")
        .addSelect("agreement.endDate", "endDate")
        .addSelect("agreement.installmentTimes", "installmentTimes")
        .addSelect("agreement.installmentPeriodValue", "installmentPeriodValue")
        .addSelect("agreement.installmentLastAmount", "installmentLastAmount");

      // accTrans
      accountReceivableQuery
        // .addSelect((subQuery) => {
        //   return subQuery
        //     .addSelect(`MAX(accTrans.paidDate)`, `lastPaidDate`)
        //     .from(AccountReceivableTransaction, "accTrans")
        //     .where("accountReceivable.id = accTrans.accountReceivableId");
        // }, `lastPaidDate`)
        .addSelect((subQuery) => {
          return subQuery
            .addSelect(`MAX(accTrans1.paidDate)`, `lastPaidDate`)
            .from(AccountReceivableTransaction, "accTrans1")
            .innerJoin("accTrans1.accountReceivable", "accountReceivable1")
            .where("accountReceivable1.agreementId = agreement.id")
            .andWhere(`accTrans1.paidDate <= :lastDate`, { lastDate });
        }, `lastPaidDate`)
        // .addSelect(
        //   `@current := DATE_ADD(CURDATE() , INTERVAL -1 DAY)`,
        //   `currentDate`
        // )
        // .addSelect(
        //   `@currentExpectedPaidTimes := TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.endDate  > @current ,@current ,agreement.installmentLastDate ))+1`,
        //   `installmentsTimesDue`
        // )
        .addSelect(
          // `@currentExpectedPaidTimes := TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.endDate  > @current ,@current ,agreement.installmentLastDate ))+1`,
          `@currentExpectedPaidTimes := TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.installmentLastDate  > '${
            fiscalYearParam - 543
          }-09-30','${
            fiscalYearParam - 543
          }-09-30' ,agreement.installmentLastDate ))+1`,
          `installmentsTimesDue`
        )
        .addSelect(
          `@currentTempExpectedPaidAmount := @currentExpectedPaidTimes * agreement.installmentAmount`,
          `currentTempExpectedPaidAmount`
        )
        .addSelect(
          `@currentExpectedPaidAmount := IF(@currentTempExpectedPaidAmount > agreement.loanAmount, agreement.loanAmount , @currentTempExpectedPaidAmount)`,
          `installmentsAmountDue`
        );
      // .addSelect(
      //   `@tempPaidAmount  := (SELECT sum(trans.paidAmount)
      //   FROM account_receivable_transactions as trans
      //     where trans.paidDate <= @current and trans.accountReceivableId = accountReceivable.id
      //   )`,
      //   `tempPaidAmount`
      // )
      // .addSelect(
      //   `@paidAmount := CAST(IF(ISNULL(@tempPaidAmount), 0, @tempPaidAmount) as decimal(10,2))`,
      //   `paidAmount`
      // )
      // .addSelect(
      //   `@currentOverdueBalance := @currentExpectedPaidAmount - @paidAmount`,
      //   `installmentsTimesOverDue`
      // )
      // .addSelect(
      //   `IF(@currentOverdueBalance  > 0 ,CEILING(@currentOverdueBalance / agreement.installmentAmount) ,0)`,
      //   `installmentsAmountOverDue`
      // );

      // // ปีงบประมาณ
      // if (fiscalYearParam) {
      //   // accountReceivableQuery.andWhere(
      //   //   `accountReceivable.fiscalYear = :fiscalYear`,
      //   //   {
      //   //     fiscalYear: fiscalYearParam,
      //   //   }
      //   // );
      //   accountReceivableQuery.andWhere("agreement.documentDate <= :lastDate", {
      //     lastDate,
      //   });
      // }
      // // ภาค
      // if (regionParam) {
      //   accountReceivableQuery.andWhere("organization.region=:region", {
      //     region: regionParam,
      //   });
      // }

      // // หน่วยงานที่รับผิดชอบ (จังหวัด)
      // if (organizationIdParam) {
      //   accountReceivableQuery.andWhere("organization.id=:organizationId", {
      //     organizationId: organizationIdParam,
      //   });
      // }

      addWhereReport2489(accountReceivableQuery, {
        fiscalYearParam,
        regionParam,
        organizationIdParam,
        lastDate,
      });

      const accountReceivable = await accountReceivableQuery
        .groupBy("accountReceivable.id")
        .addGroupBy("organization.orgName")
        .addGroupBy("agreement.documentNumber")
        .addGroupBy("agreementItems.borrower.idCardNo")
        .addGroupBy("agreementItems.borrower.title")
        .addGroupBy("agreementItems.borrower.firstname")
        .addGroupBy("agreementItems.borrower.lastname")
        .addGroupBy("agreementItems.guarantor.idCardNo")
        .addGroupBy("agreementItems.guarantor.title")
        .addGroupBy("agreementItems.guarantor.firstname")
        .addGroupBy("agreementItems.guarantor.lastname")
        .addGroupBy("agreement.loanAmount")
        .addGroupBy("agreement.InstallmentAmount")
        // .addGroupBy("accTrans.paymentType")
        .addGroupBy("accountReceivable.outstandingDebtBalance")
        .addGroupBy("agreement.documentDate")
        .addGroupBy("agreement.startDate")
        .addGroupBy("agreement.endDate")
        .addGroupBy("agreement.installmentTimes")
        .addGroupBy("agreement.installmentLastAmount")
        .orderBy("agreement.id")
        .getRawMany();

      // res.send(accountReceivable);

      if (!accountReceivable || accountReceivable.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          title1: `รายงานการรับชำระเงินทุนประกอบอาชีพ ประเภทรายบุคคล`,
          title2: `ประจำปีงบประมาณ ${fiscalYearParam || ""}`,
          fiscalYear: fiscalYearParam || "-",
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: accountReceivable,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT2-4-8-9-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `AccountRecievableReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // Report 4
  public printOverdueReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const regionParam = req.query.region;
      const organizationIdParam = req.query.organizationId;
      const lastDate = `${fiscalYearParam - 543}-09-30`;

      if (!fiscalYearParam) {
        return next(
          new NotFoundError({
            name: "กรุณาเลือกปีงบประมาณ",
          })
        );
      }
      if (!regionParam) {
        if (!organizationIdParam)
          return next(
            new NotFoundError({
              name: "กรุณาเลือกภาคหรือหน่วยงาน",
            })
          );
      }
      if (!organizationIdParam) {
        if (!regionParam)
          return next(
            new NotFoundError({
              name: "กรุณาเลือกภาคหรือหน่วยงาน",
            })
          );
      }

      let accountReceivableQuery = await getRepository(AccountReceivable)
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.transactions", "accTrans")
        .leftJoin("accountReceivable.agreement", "agreement")
        .innerJoin("agreement.agreementItems", "agreementItems")
        .innerJoin("accountReceivable.organization", "organization")

        .select("agreement.documentNumber", "documentNumber")
        .addSelect(
          `concat(agreementItems.borrower.title, agreementItems.borrower.firstname, " ", agreementItems.borrower.lastname)`,
          "borrowerName"
        )
        .addSelect("agreementItems.borrower.idCardNo", "borrowerIdCardNo")
        .addSelect(
          `concat(agreementItems.guarantor.title, agreementItems.guarantor.firstname, " ", agreementItems.guarantor.lastname)`,
          "guarantorName"
        )
        .addSelect("agreementItems.guarantor.idCardNo", "guarantorIdCardNo")
        .addSelect("agreement.loanAmount", "loanAmount")
        .addSelect("agreement.installmentAmount", "installmentAmount")
        .addSelect(
          `agreement.loanAmount - SUM(IF(DATE(accTrans.paidDate) < "${
            fiscalYearParam - 543 - 1
          }-10-01", accTrans.paidAmount, 0))`,
          `broughtForward`
        );

      addSelectTotalPaidByMonth(accountReceivableQuery, fiscalYearParam);
      addSelectTotalPaidByMonthByPaymentType(
        accountReceivableQuery,
        fiscalYearParam
      );
      addSelectTotalPaidAllMonthByPaymentType(
        accountReceivableQuery,
        fiscalYearParam
      );
      addSelectTotalPaidAllMonth(accountReceivableQuery, fiscalYearParam);
      addSelectOutstandingDebtBalance(accountReceivableQuery, fiscalYearParam);

      // Agreement details
      accountReceivableQuery = accountReceivableQuery
        .addSelect("agreement.documentDate", "documentDate")
        .addSelect("agreement.startDate", "startDate")
        .addSelect("agreement.endDate", "endDate")
        .addSelect("agreement.installmentTimes", "installmentTimes")
        .addSelect("agreement.installmentPeriodValue", "installmentPeriodValue")
        .addSelect("agreement.installmentLastAmount", "installmentLastAmount");

      // accTrans
      accountReceivableQuery
        .addSelect((subQuery) => {
          return subQuery
            .addSelect(`MAX(accTrans1.paidDate)`, `lastPaidDate`)
            .from(AccountReceivableTransaction, "accTrans1")
            .innerJoin("accTrans1.accountReceivable", "accountReceivable1")
            .where("accountReceivable1.agreementId = agreement.id")
            .andWhere(`accTrans1.paidDate <= :lastDate`, { lastDate });
        }, `lastPaidDate`)
        .addSelect(
          `@currentExpectedPaidTimes := TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.installmentLastDate  > '${
            fiscalYearParam - 543
          }-09-30','${
            fiscalYearParam - 543
          }-09-30' ,agreement.installmentLastDate ))+1`,
          `installmentsTimesDue`
        )
        .addSelect(
          `@currentTempExpectedPaidAmount := @currentExpectedPaidTimes * agreement.installmentAmount`,
          `currentTempExpectedPaidAmount`
        )
        .addSelect(
          `@currentExpectedPaidAmount := IF(@currentTempExpectedPaidAmount > agreement.loanAmount, agreement.loanAmount , @currentTempExpectedPaidAmount)`,
          `installmentsAmountDue`
        );

      addWhereReport2489(accountReceivableQuery, {
        fiscalYearParam,
        organizationIdParam,
        lastDate,
      });

      const accountReceivable = await accountReceivableQuery
        // งวดค้างชำระ มากกว่า 3 งวด
        .andWhere(`accountReceivable.status = "20"`)
        .groupBy("accountReceivable.id")
        .addGroupBy("organization.orgName")
        .addGroupBy("agreement.documentNumber")
        .addGroupBy("agreementItems.borrower.idCardNo")
        .addGroupBy("agreementItems.borrowerTitle")
        .addGroupBy("agreementItems.borrowerFirstname")
        .addGroupBy("agreementItems.borrowerLastname")
        .addGroupBy("agreementItems.guarantor.idCardNo")
        .addGroupBy("agreementItems.guarantor.title")
        .addGroupBy("agreementItems.guarantor.firstname")
        .addGroupBy("agreementItems.guarantor.lastname")
        .addGroupBy("agreement.loanAmount")
        .addGroupBy("agreement.InstallmentAmount")
        .addGroupBy("accountReceivable.outstandingDebtBalance")
        .addGroupBy("agreement.documentDate")
        .addGroupBy("agreement.startDate")
        .addGroupBy("agreement.endDate")
        .addGroupBy("agreement.installmentTimes")
        .addGroupBy("agreement.installmentLastAmount")
        .orderBy("agreement.id")
        .getRawMany();

      // res.send(accountReceivable);

      if (!accountReceivable || accountReceivable.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          title1: `รายงานรายชื่อผู้ค้างชำระกู้ยืมเงินทุนประกอบอาชีพติดต่อกันเกิน 3 งวด`,
          title2: `ประจำปีงบประมาณ ${fiscalYearParam || ""}`,
          fiscalYear: fiscalYearParam || "-",
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: accountReceivable,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT2-4-8-9-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `OverdueReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // Report 8
  public printAgeingReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const regionParam = req.query.region;
      const organizationIdParam = req.query.organizationId;
      const lastDate = `${fiscalYearParam - 543}-09-30`;

      if (!fiscalYearParam) {
        return next(
          new NotFoundError({
            name: "กรุณาเลือกปีงบประมาณ",
          })
        );
      }
      if (!organizationIdParam) {
        return next(
          new NotFoundError({
            name: "กรุณาเลือกหน่วยงาน",
          })
        );
      }

      let accountReceivableQuery = await getRepository(AccountReceivable)
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.transactions", "accTrans")
        .innerJoin("accountReceivable.agreement", "agreement")
        .innerJoin("agreement.agreementItems", "agreementItems")
        .innerJoin("accountReceivable.organization", "organization")
        .innerJoin("accountReceivable.controls", "controls")

        .select("agreement.documentNumber", "documentNumber")
        .addSelect(
          `concat(agreementItems.borrower.title, agreementItems.borrower.firstname, " ", agreementItems.borrower.lastname)`,
          "borrowerName"
        )
        .addSelect("agreementItems.borrower.idCardNo", "borrowerIdCardNo")
        .addSelect(
          `concat(agreementItems.guarantor.title, agreementItems.guarantor.firstname, " ", agreementItems.guarantor.lastname)`,
          "guarantorName"
        )
        .addSelect("agreementItems.guarantor.idCardNo", "guarantorIdCardNo")
        .addSelect("agreement.loanAmount", "loanAmount")
        .addSelect("agreement.installmentAmount", "installmentAmount")
        .addSelect(
          `agreement.loanAmount - SUM(IF(DATE(accTrans.paidDate) < "${
            fiscalYearParam - 543 - 1
          }-10-01", accTrans.paidAmount, 0))`,
          `broughtForward`
        );

      addSelectTotalPaidByMonth(accountReceivableQuery, fiscalYearParam);
      addSelectTotalPaidByMonthByPaymentType(
        accountReceivableQuery,
        fiscalYearParam
      );
      addSelectTotalPaidAllMonthByPaymentType(
        accountReceivableQuery,
        fiscalYearParam
      );
      addSelectTotalPaidAllMonth(accountReceivableQuery, fiscalYearParam);
      addSelectOutstandingDebtBalance(accountReceivableQuery, fiscalYearParam);

      // Agreement details
      accountReceivableQuery = accountReceivableQuery
        .addSelect("agreement.documentDate", "documentDate")
        .addSelect("agreement.startDate", "startDate")
        .addSelect("agreement.endDate", "endDate")
        .addSelect("agreement.installmentTimes", "installmentTimes")
        .addSelect("agreement.installmentPeriodValue", "installmentPeriodValue")
        .addSelect("agreement.installmentLastAmount", "installmentLastAmount");

      // accTrans
      accountReceivableQuery
        .addSelect((subQuery) => {
          return subQuery
            .addSelect(`MAX(accTrans1.paidDate)`, `lastPaidDate`)
            .from(AccountReceivableTransaction, "accTrans1")
            .innerJoin("accTrans1.accountReceivable", "accountReceivable1")
            .where("accountReceivable1.agreementId = agreement.id")
            .andWhere(`accTrans1.paidDate <= :lastDate`, { lastDate });
        }, `lastPaidDate`)
        .addSelect(
          `@current := DATE_ADD(CURDATE() , INTERVAL -1 DAY)`,
          `currentDate`
        )
        .addSelect(
          `@currentExpectedPaidTimes := TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.installmentLastDate  > '${
            fiscalYearParam - 543
          }-09-30','${
            fiscalYearParam - 543
          }-09-30' ,agreement.installmentLastDate ))+1`,
          `installmentsTimesDue`
        )
        .addSelect(
          `@currentTempExpectedPaidAmount := @currentExpectedPaidTimes * agreement.installmentAmount`,
          `currentTempExpectedPaidAmount`
        )
        .addSelect(
          `@currentExpectedPaidAmount := IF(@currentTempExpectedPaidAmount > agreement.loanAmount, agreement.loanAmount , @currentTempExpectedPaidAmount)`,
          `installmentsAmountDue`
        );
      accountReceivableQuery.where(
        new Brackets((qb) => {
          qb.where((qb1) => {
            const subQuery = qb1
              .subQuery()
              .select("control.id")
              .from("AccountReceivableControl", "control")
              .where("control.accountReceivableId = accountReceivable.id")
              .orderBy("control.asOfDate", "DESC")
              .limit(1);
            return `controls.id = ${subQuery.getQuery()}`;
          });
        })
      );

      addWhereReport2489(accountReceivableQuery, {
        fiscalYearParam,
        organizationIdParam,
        lastDate,
      });

      const accountReceivable = await accountReceivableQuery
        // งวดค้างชำระตั้งแต่ 2-12 งวด
        // .andWhere(
        //   "TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.endDate  > @current ,@current ,agreement.installmentLastDate ))+1 > 2"
        // )
        // .andWhere(
        //   "TIMESTAMPDIFF(MONTH, agreement.installmentFirstDate , IF(agreement.endDate  > @current ,@current ,agreement.installmentLastDate ))+1 < 12"
        // )
        .andWhere(
          "controls.status IN ('2', '3', '4', '5', '6', '7', '8', '9', 'F')"
        )
        .groupBy("accountReceivable.id")
        .addGroupBy("organization.orgName")
        .addGroupBy("agreement.documentNumber")
        .addGroupBy("agreementItems.borrower.idCardNo")
        .addGroupBy("agreementItems.borrowerTitle")
        .addGroupBy("agreementItems.borrowerFirstname")
        .addGroupBy("agreementItems.borrowerLastname")
        .addGroupBy("agreementItems.guarantor.idCardNo")
        .addGroupBy("agreementItems.guarantor.title")
        .addGroupBy("agreementItems.guarantor.firstname")
        .addGroupBy("agreementItems.guarantor.lastname")
        .addGroupBy("agreement.loanAmount")
        .addGroupBy("agreement.InstallmentAmount")
        // .addGroupBy("accTrans.paymentType")
        .addGroupBy("accountReceivable.outstandingDebtBalance")
        .addGroupBy("agreement.documentDate")
        .addGroupBy("agreement.startDate")
        .addGroupBy("agreement.endDate")
        .addGroupBy("agreement.installmentTimes")
        .addGroupBy("agreement.installmentLastAmount")
        .orderBy("agreement.id")
        .getRawMany();

      // res.send(accountReceivable);

      if (!accountReceivable || accountReceivable.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          title1: `รายงานรายชื่อผู้ค้างชำระกู้ยืมเงินทุนประกอบอาชีพติดต่อตั้งแต่ 2-12 งวด ขึ้นไป`,
          title2: `ประจำปีงบประมาณ ${fiscalYearParam || ""}`,
          fiscalYear: fiscalYearParam || "-",
          reportDataDate: `ข้อมูล ณ วันที่ ${getThaiPartialDate(
            moment().format()
          )}`,
          data: accountReceivable,
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT2-4-8-9-xlsx-recipe" },
          data: templateData,
        });

        const reportName = `AgeingReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  // Report 5
  public printCloseAccountReport = async (req, res, next) => {
    try {
      const fiscalYearParam = req.query.fiscalYear;
      const regionParam = req.query.region;
      const organizationIdParam = req.query.organizationId;

      let accountReceivableQuery = await getRepository(AccountReceivable)
        // let accountReceivableQuery = await getRepository(
        //   AccountReceivableTransaction
        // )
        // .createQueryBuilder("accTrans")
        // .leftJoin("accTrans.accountReceivable", "accountReceivable")
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.transactions", "accTrans")
        .leftJoin("accountReceivable.organization", "organization")
        .select("organization.orgName", "orgName");
      accountReceivableQuery = addSelectRegion(accountReceivableQuery);

      if (!fiscalYearParam) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      }

      const year = +fiscalYearParam - 543;
      const prevYear = year - 1;
      const firstDateOfYear = `${prevYear}-10-01`;
      const lastDateOfYear = `${year}-09-30`;

      accountReceivableQuery.addSelect(
        `SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge != TRUE, accountReceivable.loanAmount, 0))`,
        `totalLoanAmount`
      );
      accountReceivableQuery.addSelect(
        `SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge != TRUE, accTrans.paidAmount, 0))`,
        "totalPaidAllMonth"
      );
      accountReceivableQuery.addSelect(
        "SUM(IF((accountReceivable.status = '11'), 1, 0))",
        "totalClose"
      );
      accountReceivableQuery.addSelect(
        `SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge = TRUE, 1, 0))`,
        "totalAcknowledge"
      );
      accountReceivableQuery.addSelect(
        "SUM(IF((accountReceivable.status = '11'), 1, 0)) + SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge = TRUE, 1, 0))",
        "total"
      );
      accountReceivableQuery.addSelect(
        `SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge = TRUE, accountReceivable.debtAcknowledgementDebtAmount, 0))`,
        "totalAcknowledgeAmount"
      );
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
      // ภาค
      if (regionParam) {
        //
        accountReceivableQuery.andWhere("organization.region=:region", {
          region: regionParam,
        });
      }

      // หน่วยงานที่รับผิดชอบ (จังหวัด)
      if (organizationIdParam) {
        //
        accountReceivableQuery.andWhere("organization.id=:organizationId", {
          organizationId: organizationIdParam,
        });
      }

      // accountReceivableQuery.orderBy("accTrans.paidDate", "DESC").limit(1);

      let accountReceivableTotalQuery = await getRepository(AccountReceivable)
        // let accountReceivableTotalQuery = await getRepository(
        //   AccountReceivableTransaction
        // )
        .createQueryBuilder("accountReceivable")
        .leftJoin("accountReceivable.transactions", "accTrans")
        // .createQueryBuilder("accTrans")
        // .leftJoin("accTrans.accountReceivable", "accountReceivable")
        .leftJoin("accountReceivable.organization", "organization")
        .select([]);
      accountReceivableTotalQuery.addSelect(
        `SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge != TRUE, accountReceivable.loanAmount, 0))`,
        `totalAllLoanAmount`
      );
      accountReceivableTotalQuery.addSelect(
        `SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge != TRUE, accTrans.paidAmount, 0))`,
        "totalAllPaidAllMonth"
      );
      accountReceivableTotalQuery.addSelect(
        "SUM(IF((accountReceivable.status = '11'), 1, 0))",
        "totalAllClose"
      );
      accountReceivableTotalQuery.addSelect(
        `SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge = TRUE, 1, 0))`,
        "totalAllAcknowledge"
      );
      accountReceivableTotalQuery.addSelect(
        "SUM(IF((accountReceivable.status = '11'), 1, 0)) + SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge = TRUE, 1, 0))",
        "totalAll"
      );
      accountReceivableTotalQuery.addSelect(
        `SUM(IF(accountReceivable.debtAcknowledgementIsAcknowledge = TRUE, accountReceivable.debtAcknowledgementDebtAmount, 0))`,
        "totalAllAcknowledgeAmount"
      );

      accountReceivableTotalQuery.andWhere(
        new Brackets((qb) => {
          qb.where("accTrans.outstandingDebtBalance = 0.00").orWhere(
            "accountReceivable.debtAcknowledgementIsAcknowledge = TRUE"
          );
        })
      );

      // ปีงบประมาณ
      if (fiscalYearParam) {
        //
        accountReceivableTotalQuery.andWhere(
          "accTrans.paidDate BETWEEN :startDocumentDate AND :endDocumentDate",
          {
            startDocumentDate: firstDateOfYear,
            endDocumentDate: lastDateOfYear,
          }
        );
      }
      // ภาค
      if (regionParam) {
        //
        accountReceivableTotalQuery.andWhere("organization.region=:region", {
          region: regionParam,
        });
      }
      // หน่วยงานที่รับผิดชอบ (จังหวัด)
      if (organizationIdParam) {
        //
        accountReceivableTotalQuery.andWhere(
          "organization.id=:organizationId",
          {
            organizationId: organizationIdParam,
          }
        );
      }

      const [accountReceivable, totalResults] = await Promise.all([
        accountReceivableQuery
          .groupBy("organization.region")
          .addGroupBy("organization.orgName")
          // .addGroupBy("accTrans.paidDate")
          // .addGroupBy("accountReceivable.id")
          // .addGroupBy("accTrans.paidAmount")
          .getRawMany(),
        accountReceivableTotalQuery.getRawMany(),
      ]);

      // console.log(accountReceivable, totalResults);
      // return res.json({ data: "test" });

      if (!accountReceivable || accountReceivable.length <= 0) {
        return next(
          new NotFoundError({
            name: this.reportNotFoundMessage,
          })
        );
      } else {
        const templateData = {
          title1: `รายงานการปิดหนี้รายจังหวัด`,
          title2: `ประจำปีงบประมาณ ${fiscalYearParam || ""}`,
          fiscalYear: fiscalYearParam || "-",
          reportDataDate: getThaiPartialDate(moment().format()),
          data: accountReceivable,
          total: totalResults[0],
        };
        // res.send(templateData);

        const resp = await jsreport.render({
          template: { name: "REPORT5" },
          data: templateData,
        });

        const reportName = `CloseAccountReport${new Date().toISOString()}.xlsx`;
        res
          .header("Content-Disposition", `attachment; filename=${reportName}`)
          .header("filename", reportName)
          .send(resp.content);
      }
    } catch (e) {
      next(e);
    }
  };

  setDebtCollectionParams = (req, res, next) => {
    req.query.status = accountReceiviableStatusSet.unpaid;
    req.query.active = 1; // for boolean on mysql
    next();
  };
}

export const controller = new AccountReceivableController(
  "AccountReceivable",
  "ลูกหนี้"
);
