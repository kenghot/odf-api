import { SelectQueryBuilder } from "typeorm";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { agreementStatusSet } from "../../enumset";
import { getEnumSetList, IItemSet } from "../../utils/get-enum-set-text";

const paymentTypes = getEnumSetList("paymentType");
const paymentTypeArrayString = paymentTypes
  .map((item) => `'${item.value}'`)
  .join(",");

interface IReport9 {
  fiscalYearParam?: any;
  monthParam?: any;
  organizationIdParam?: any;
  regionParam?: any;
  lastDate?: any;
}
export const addWhereReport2489 = (
  qb: SelectQueryBuilder<AccountReceivable>,
  params: IReport9
) => {
  const {
    fiscalYearParam,
    monthParam,
    organizationIdParam,
    lastDate,
    regionParam,
  } = params;
  // ปีงบประมาณ
  if (fiscalYearParam) {
    qb.andWhere("agreement.documentDate <= :lastDate", {
      lastDate,
    });
  }
  // เดือน
  if (monthParam) {
    qb.andWhere(`accountReceivable.fiscalYear = :fiscalYear`, {
      fiscalYear: fiscalYearParam,
    });
  }
  // หน่วยงานที่รับผิดชอบ (จังหวัด)
  if (organizationIdParam) {
    qb.andWhere("organization.id=:organizationId", {
      organizationId: organizationIdParam,
    });
  }
  // ภาค
  if (regionParam) {
    qb.andWhere("organization.region=:region", {
      region: regionParam,
    });
  }
  // qb.andWhere("agreement.status IN (:...status)", {
  //   status: [
  //     agreementStatusSet.done,
  //     agreementStatusSet.adjusted,
  //     agreementStatusSet.close,
  //   ],
  // });
};
export const addWhereReport9 = (qb: SelectQueryBuilder<AccountReceivable>) => {
  qb.andWhere("agreement.status IN (:...status)", {
    status: [
      agreementStatusSet.done,
      agreementStatusSet.adjusted,
      agreementStatusSet.close,
    ],
  });
};

export const addSelectTotalPaidByMonth = (
  qb: SelectQueryBuilder<AccountReceivable>,
  fiscalYearParam: any
) => {
  getEnumSetList("monthEN").forEach((item: IItemSet, index: number) => {
    const monthIndex = index + 1;
    let isMinus = [10, 11, 12].includes(monthIndex);
    let oneOrZero = isMinus ? 1 : 0;
    qb.addSelect(
      `SUM(IF(MONTH(accTrans.paidDate) = ${monthIndex} AND YEAR(accTrans.paidDate) = ${
        fiscalYearParam - 543 - oneOrZero
      }, accTrans.paidAmount, 0))`,
      `totalPaid${item.text}`
    );
  });
};
export const addSelectTotalPaidByMonthByPaymentType = (
  qb: SelectQueryBuilder<AccountReceivable>,
  fiscalYearParam: any
) => {
  paymentTypes.forEach((payment: IItemSet) => {
    // 12 month paid
    getEnumSetList("monthEN").forEach((item: IItemSet, index: number) => {
      const monthIndex = index + 1;
      let isMinus = [10, 11, 12].includes(monthIndex);
      let oneOrZero = isMinus ? 1 : 0;
      if(payment.value=="OFFICE"){
        qb.addSelect(
          `SUM(IF(MONTH(accTrans.paidDate) = ${monthIndex} AND YEAR(accTrans.paidDate) = ${
            fiscalYearParam - 543 - oneOrZero
            // fiscalYearParam - 1
          } AND (accTrans.paymentType ='OFFICE' OR accTrans.paymentType ='OFFICE-M')  , accTrans.paidAmount, 0))`,
          `totalPaid${item.text}${payment.value=='OFFICE-M'?'OFFICE_M':payment.value}`
        );
      }else{
        qb.addSelect(
          `SUM(IF(MONTH(accTrans.paidDate) = ${monthIndex} AND YEAR(accTrans.paidDate) = ${
            fiscalYearParam - 543 - oneOrZero
            // fiscalYearParam - 1
          } AND accTrans.paymentType = '${
            payment.value
          }'  , accTrans.paidAmount, 0))`,
          `totalPaid${item.text}${payment.value=='OFFICE-M'?'OFFICE_M':payment.value}`
        );
      }
      //----old code 27042022----
      // qb.addSelect(
      //   `SUM(IF(MONTH(accTrans.paidDate) = ${monthIndex} AND YEAR(accTrans.paidDate) = ${
      //     fiscalYearParam - 543 - oneOrZero
      //     // fiscalYearParam - 1
      //   } AND accTrans.paymentType = '${
      //     payment.value
      //   }'  , accTrans.paidAmount, 0))`,
      //   `totalPaid${item.text}${payment.value}`
      // );
    });
  });

  getEnumSetList("monthEN").forEach((item: IItemSet, index: number) => {
    const monthIndex = index + 1;
    let isMinus = [10, 11, 12].includes(monthIndex);
    let oneOrZero = isMinus ? 1 : 0;
    qb.addSelect(
      `SUM(IF(MONTH(accTrans.paidDate) = ${monthIndex} AND YEAR(accTrans.paidDate) = ${
        fiscalYearParam - 543 - oneOrZero
        // fiscalYearParam - 1
      } AND accTrans.paymentType NOT IN (${paymentTypeArrayString})  , accTrans.paidAmount, 0))`,
      `totalPaid${item.text}SYSTEM`
    );
  });
};
export const addSelectTotalPaidAllMonthByPaymentType = (
  qb: SelectQueryBuilder<AccountReceivable>,
  fiscalYearParam: any
) => {
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
    qb.addSelect(
      `@totalPaidAllMonth := SUM(IF(DATE(accTrans.paidDate) >= concat(${
        fiscalYearParam - 543 - 1
      }, "-10-01") AND DATE(accTrans.paidDate) <=  concat(${
        fiscalYearParam - 543
      }, "-09-30") AND accTrans.paymentType = '${
        payment.value
      }', accTrans.paidAmount, 0))`,
      `totalPaidAllMonth${payment.value}`
    );
    qb.addSelect(
      `@totalPaidAllMonthSYSTEM := SUM(IF(DATE(accTrans.paidDate) >= concat(${
        fiscalYearParam - 543 - 1
      }, "-10-01") AND DATE(accTrans.paidDate) <=  concat(${
        fiscalYearParam - 543
      }, "-09-30") AND accTrans.paymentType NOT IN (${paymentTypeArrayString}), accTrans.paidAmount, 0))`,
      `totalPaidAllMonthSYSTEM`
    );
  });
};
export const addSelectTotalPaidAllMonth = (
  qb: SelectQueryBuilder<AccountReceivable>,
  fiscalYearParam: any
) => {
  qb.addSelect(
    `@totalPaidAllMonth := SUM(IF(DATE(accTrans.paidDate) >= concat(${
      fiscalYearParam - 543 - 1
    }, "-10-01") AND DATE(accTrans.paidDate) <=  concat(${
      fiscalYearParam - 543
    }, "-09-30"), accTrans.paidAmount, 0))`,
    `totalPaidAllMonth`
  );
};
export const addSelectOutstandingDebtBalance = (
  qb: SelectQueryBuilder<AccountReceivable>,
  fiscalYearParam: any
) => {
  qb.addSelect(
    `(agreement.loanAmount - SUM(IF(DATE(accTrans.paidDate) < "${
      fiscalYearParam - 543 - 1
    }-10-01", accTrans.paidAmount, 0))) - (SUM(IF(DATE(accTrans.paidDate) >= concat(${
      fiscalYearParam - 543 - 1
    }, "-10-01") AND DATE(accTrans.paidDate) <=  concat(${
      fiscalYearParam - 543
    }, "-09-30"), accTrans.paidAmount, 0)))`,
    `outstandingDebtBalance`
  );
};

export const addSelectSubQueryTotalLoanAmount = (
  qb: SelectQueryBuilder<AccountReceivable>,
  fiscalYearParam,
  monthParam,
  organizationIdParam,
  lastDate
) => {
  qb.addSelect((subQb) => {
    subQb
      .select("SUM(agreement.loanAmount)")
      .from(AccountReceivable, "accountReceivable")
      .leftJoin("accountReceivable.agreement", "agreement")
      .innerJoin("accountReceivable.organization", "organization");
    addWhereReport2489(subQb, {
      fiscalYearParam,
      monthParam,
      organizationIdParam,
      lastDate,
    });
    addWhereReport9(subQb);

    return subQb;
  }, "totalLoanAmount");
};
