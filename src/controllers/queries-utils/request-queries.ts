import { SelectQueryBuilder } from "typeorm";
import { BudgetAllocationItem } from "../../entities/BudgetAllocationItem";
import { Request } from "../../entities/Request";
import { Agreement } from "../../entities/Agreement";
import { AgreementItem } from "../../entities/AgreementItem";

// precondition ตั้งชื่อ query bulder ว่า requests:: createQueryBuilder("requests")

// ประมาณ คชจ
export const addSelectTotalBudget = (requests: SelectQueryBuilder<Request>) => {
  return requests.addSelect((subQuery) => {
    return (
      subQuery
        // .select("SUM(budget.subTotal)")
        .select("SUM(budget.cost * budget.quality)")
        .from(BudgetAllocationItem, "budget")
        .where("requests.id = budget.requestId")
    );
  }, "totalBudget");
};

// สถานะคำร้อง
export const addSelectStatus = (requests: SelectQueryBuilder<Request>) => {
  return requests.addSelect(
    `CASE  requests.status
      WHEN "QF" THEN "ผ่านการตรวจสอบคุณสมบัติเบื้องต้น"
      WHEN "AP1" THEN "อนุมัติโดยหัวหน้างาน"
      WHEN "AP2" THEN "อนุมัติโดยคณะอนุฯ"
      WHEN "AP3" THEN "อนุมัติโดยคณะกรรมการกองทุนฯ"
      WHEN "DN" THEN "ส่งทำสัญญาแล้ว"
      ELSE  "ไม่ผ่านคุณสมบัติ" 
    END`,
    "status"
  );
};
// สถานะคำร้อง
export const addSelectStatus2 = (requests: SelectQueryBuilder<Request>) => {
  return requests.addSelect(
    `CASE  requests.status
      WHEN "DF" THEN "แบบร่างคำร้อง"
      WHEN "NW" THEN "ยื่นคำร้องใหม่"
      WHEN "QF" THEN "ตรวจสอบผ่านคุณสมบัติ"
      WHEN "AP1" THEN "อนุมัติโดยหัวหน้างาน"
      WHEN "AP2" THEN "อนุมัติโดยคณะอนุฯ"
      WHEN "AP3" THEN "อนุมัติโดยคณะกรรมการกองทุนฯ"
      WHEN "DN" THEN "ส่งทำสัญญาแล้ว"
      WHEN "CL" THEN "ยกเลิกคำร้อง"
      WHEN "DQF" THEN "ไม่ผ่านคุณสมบัติ"
      WHEN "RJ" THEN "คำร้องไม่อนุมัติ"
      ELSE  "ไม่ผ่านคุณสมบัติ" 
    END`,
    "status"
  );
};

// ผลสอบคุณสมบัติ precondition :: leftJoin("requests.factSheet", "factSheet")
export const addSelectQualification = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `IF(factSheet.borrowerScore > 65 AND factSheet.guarantorScore > 65, 'ผ่าน', 'ไม่ผ่าน')`,
    "qualification"
  );
};

// ความเห็นเจ้าหน้าที่ precondition :: leftJoin("requests.factSheet", "factSheet")
export const addSelectFactSheetResult = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `IF(factSheet.isApproved, "สมควรให้กู้", "ไม่สมควรให้กู้")`,
    "factSheetResult"
  );
};

// ความเห็นเจ้าหน้าที่ precondition :: leftJoin("requests.factSheet", "factSheet")
export const addSelectFactSheetComments = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `concat(IF(factSheet.isApproved, "สมควรให้กู้", "ไม่สมควรให้กู้"), " ", factSheet.comments)`,
    "factSheetComments"
  );
};

// วงเงินที่ควรพิจารณา
export const addSelectConsiderationBudget = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `CASE  requests.status
       WHEN "QF" THEN requests.requestBudget
       WHEN "AP1" THEN requests.result1ApproveBudget
       WHEN "AP2" THEN requests.result2ApproveBudget
       WHEN "AP3" THEN requests.result3ApproveBudget
       WHEN "DN" THEN requests.result3ApproveBudget
       ELSE  0 
    END`,
    "considerationBudget"
  );
};

// กู้ครั้งที่ precondition :: leftJoin("requests.requestItems", "requestItems")
export const addSelectLoanTimes = (requests: SelectQueryBuilder<Request>) => {
  return requests.addSelect((subQuery) => {
    return subQuery
      .select("count(*)+1")
      .from(Agreement, "agreements")
      .innerJoin(AgreementItem, "aitem")
      .where("agreements.id = aitem.agreementId")
      .andWhere("aitem.borrowerIdCardNo = requestItems.borrowerIdCardNo")
      .andWhere("requestItems.borrowerIdCardNo NOT IN ('', ' ', NULL)")
      .andWhere(`agreements.status != "CL"`);
  }, "loanTimes");
};

// ผลการพิจารณา
export const addSelectConsiderationResult = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `CASE  requests.status
      WHEN "AP1" THEN IF(requests.result1Result = "AP" OR requests.result1Result = "AJ","สมควรให้กู้ยืม","ไม่สมควรให้กู้ยืม")
      WHEN "AP2" THEN IF(requests.result2Result = "AP" OR requests.result2Result = "AJ","สมควรให้กู้ยืม","ไม่สมควรให้กู้ยืม")
      WHEN "AP3" THEN IF(requests.result3Result = "AP" OR requests.result3Result = "AJ","สมควรให้กู้ยืม","ไม่สมควรให้กู้ยืม")
      WHEN "DN" THEN IF(requests.result3Result = "AP" OR requests.result3Result = "AJ","สมควรให้กู้ยืม","ไม่สมควรให้กู้ยืม")
      ELSE  "ยังไม่เข้าคณะพิจารณา/ไม่อนุมัติ" 
    END`,
    "considerationResult"
  );
};

// วงเงินอนุมัติ
export const addSelectApproveBudget = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `CASE  requests.status
      WHEN "AP1" THEN requests.result1ApproveBudget
      WHEN "AP2" THEN  requests.result2ApproveBudget
      WHEN "AP3" THEN  requests.result3ApproveBudget
      WHEN "DN" THEN  requests.result3ApproveBudget
      ELSE  "-" 
    END`,
    "approveBudget"
  );
};

// การพิจารณาหมายเหตุ
export const addSelectResultComments = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `CASE  requests.status
      WHEN "AP1" THEN requests.result1Comments
      WHEN "AP2" THEN  requests.result2Comments
      WHEN "AP3" THEN  requests.result3Comments
      WHEN "DN" THEN  requests.result3Comments
      ELSE  "-" 
    END`,
    "resultComments"
  );
};

// การพิจารณาหมายเหตุ
export const addSelectResultComments2 = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests
    .addSelect("requests.result3Comments", "result3Comments")
    .addSelect("requests.result2Comments", "result2Comments")
    .addSelect("requests.result1Comments", "result1Comments")
    .addSelect(
      `CASE
          WHEN result3Comments != '' THEN result3Comments
          WHEN result2Comments != '' THEN result2Comments
          WHEN result1Comments != '' THEN result1Comments
          ELSE "-"
        END`,
      "resultComments"
    );
};

// การพิจารณาหมายเหตุ
export const addSelectResult = (requests: SelectQueryBuilder<Request>) => {
  return requests
    .addSelect("requests.result3Result", "result3Result")
    .addSelect("requests.result2Result", "result2Result")
    .addSelect("requests.result1Result", "result1Result")
    .addSelect(
      `CASE
          WHEN result3Result IS NOT NULL THEN 
            CASE 
              WHEN result3Result = 'AP' THEN 'เห็นชอบตามวงเงิน'
              WHEN result3Result = 'AJ' THEN 'เห็นควรให้ปรับเพิ่ม/ลดวงเงิน'
              WHEN result3Result = 'RJ' THEN 'ไม่อนุมัติ'
            END
          WHEN result3Result IS NOT NULL THEN 
            CASE 
              WHEN result2Result = 'AP' THEN 'เห็นชอบตามวงเงิน'
              WHEN result2Result = 'AJ' THEN 'เห็นควรให้ปรับเพิ่ม/ลดวงเงิน'
              WHEN result2Result = 'RJ' THEN 'ไม่อนุมัติ'
            END
          WHEN result1Result IS NOT NULL THEN 
            CASE 
              WHEN result1Result = 'AP' THEN 'เห็นชอบตามวงเงิน'
              WHEN result1Result = 'AJ' THEN 'เห็นควรให้ปรับเพิ่ม/ลดวงเงิน'
              WHEN result1Result = 'RJ' THEN 'ไม่อนุมัติ'
            END
          ELSE "-"
        END`,
      "resultResult"
    );
};

// คำร้องที่พิจารณาโดยที่ประชุม หัวหน้างาน/กลุ่ม  :: คำร้องที่พิจารณาโดยที่ประชุม คณะอนุกรรมการกลั่นกรองฯ :: คำร้องที่พิจารณาโดยที่ประชุม คณะกรรมการบริหารกองทุนฯ
export const addSelectGroupResultByMeeting = (
  requests: SelectQueryBuilder<Request>,
  resultColumn: "result1" | "result2" | "result3",
  aliasName?: string
) => {
  return requests
    .addSelect(
      `SUM(requests.${resultColumn}.approveBudget)`,
      `${aliasName || resultColumn}ToTalApproveBudget`
    )
    .addSelect(
      `SUM(IF(requests.${resultColumn}.result = 'AP' or requests.${resultColumn}.result = 'AJ', 1, 0))`,
      `${aliasName || resultColumn}TotalApprove`
    )
    .addSelect(
      `SUM(IF(requests.${resultColumn}.result = 'RJ', 1, 0))`,
      `${aliasName || resultColumn}TotalReject`
    )
    .addSelect(
      `SUM(IF(requests.${resultColumn}.result = 'AJ' or requests.${resultColumn}.result = 'AP' or requests.${resultColumn}.result = 'RJ', 1, 0))`,
      `${aliasName || resultColumn}Total`
    );
};

// จำนวนผู้กู้ยืมทั้งหมดที่ผ่านเกณฑ์ และ ไม่ผ่านเกณฑ์
export const getQualificationNumber = (requestsFromQuery: any) => {
  let passedQualificationNumber = 0;
  let notPassedQualificationNumber = 0;
  requestsFromQuery.forEach((request) => {
    if (request.qualification === "ผ่าน") {
      passedQualificationNumber += 1;
    } else {
      notPassedQualificationNumber += 1;
    }
  });
  return { passedQualificationNumber, notPassedQualificationNumber };
};

// สถานะภาพผู้กู้
export const addSelectBorrowerMarriageStatus = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `CASE  requestItems.borrowerMarriageStatus
      WHEN "0" THEN "โสด"
      WHEN "1" THEN "แต่งงานแล้ว"
      WHEN "2" THEN "ยังไม่ได้จดทะเบียน"
      WHEN "3" THEN "หย่า"
      WHEN "4" THEN "หม้าย"
      ELSE  "ไม่ได้แจ้ง" END`,
    "borrowerMarriageStatus"
  );
};

// ความสัมพันธ์กับผู้ขอกู้
export const addSelectGuarantorBorrowerRelationship = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `CASE requestItems.guarantorBorrowerRelationship
      WHEN "0" THEN "บุตร"
      WHEN "1" THEN "ญาติ"
      WHEN "2" THEN "เพือนบ้าน"
      ELSE  "ไม่ได้แจ้ง" END`,
    "guarantorBorrowerRelationship"
  );
};

// สถานะภาพผู้ค้ำ
export const addSelectGuarantorMarriageStatus = (
  requests: SelectQueryBuilder<Request>
) => {
  return requests.addSelect(
    `CASE requestItems.guarantorMarriageStatus
      WHEN "0" THEN "โสด"
      WHEN "1" THEN "แต่งงานแล้ว"
      WHEN "2" THEN "ยังไม่ได้จดทะเบียน"
      WHEN "3" THEN "หย่า"
      WHEN "4" THEN "หม้าย"
      ELSE  "ไม่ได้แจ้ง" END`,
    "guarantorMarriageStatus"
  );
};
