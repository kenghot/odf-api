import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne
} from "typeorm";

import { Length } from "class-validator";
import { bankSet, loanTypeSet, requestStatusSet } from "../enumset";
import { ValidateError } from "../middlewares/error/error-type";
import { validateFields } from "../utils/class-validator";
import { getThaiPartialDate } from "../utils/datetime-helper";
import { idcardFormatting, fullNameFormatting } from "../utils/format-helper";
import { getEnumSetText } from "../utils/get-enum-set-text";
import { convertFullMoney } from "../utils/money-to-thai-text";
import { BudgetAllocationItem } from "./BudgetAllocationItem";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { EmbeddedConsolidation } from "./embedded/EmbeddedConsolidation";
import { EmbeddedOccupation } from "./embedded/EmbeddedOccupation";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { RequestFactSheet } from "./RequestFactSheet";
import { RequestItem } from "./RequestItem";

@Entity("requests")
export class Request extends BaseEntity {
  // หน่วยงานที่สร้างคำร้อง
  @Column({ nullable: false, comment: "หน่วยงานที่สร้างคำร้อง" })
  organizationId: number;
  @ManyToOne(() => Organization, { nullable: false })
  organization: Organization;

  // รหัสอ้างอิงสำหรับออกรายงานแบบ force
  @Column({ default: "", comment: "รหัสอ้างอิงสำหรับออกรายงานแบบ force" })
  refReportCode: string;

  // ปีงบประมาณ
  @Column({ default: "", comment: "ปีงบประมาณ" })
  fiscalYear: string;

  // วันที่ยื่นคำร้อง
  @Column({ type: "date", nullable: true, comment: "วันที่ยื่นคำร้อง" })
  documentDate: Date | string;

  // เลขที่คำร้อง
  @Column({ length: 48, unique: true, comment: "เลขที่คำร้อง", nullable: true })
  documentNumber: string;

  // ประเภท รายบุคคล / กลุ่ม
  @Column({
    default: loanTypeSet.personal,
    comment: `ประเภท รายบุคคล / กลุ่ม personal = "P", group = "G"`
  })
  requestType: loanTypeSet;

  // ชื่อคำร้อง ถ้าเป็นแบบกลุ่มใส่ชื่อกลุ่ม ถ้าแบบรายบุคคลใส่ {title}{firstname} {lastname}
  @Column({
    length: 255,
    default: "",
    comment:
      "ชื่อคำร้อง ถ้าเป็นแบบกลุ่มใส่ชื่อกลุ่ม ถ้าแบบรายบุคคลใส่ {title}{firstname} {lastname}"
  })
  name: string;

  // สถานที่ยื่นคำร้อง ดึงข้อมูลอัตโนมัตจาก organization
  @Column({
    length: 255,
    default: "",
    comment: "สถานที่ยื่นคำร้อง ดึงข้อมูลอัตโนมัตจาก organization"
  })
  requestLocation: string;

  // สถานะคำร้อง
  @Column({
    default: requestStatusSet.draft,
    comment: `สถานะคำร้อง draft = "DF", new = "NW", qualified = "QF", approve1 = "AP1", approve2 = "AP2", approve3 = "AP3", done = "DN", cancel = "CL", disqualified = "DQF", reject = "RJ",`
  })
  status: requestStatusSet;

  // borrower info is in item
  @OneToMany(
    () => RequestItem,
    (requestItem) => requestItem.request,
    {
      cascade: ["insert", "update"]
    }
  )
  requestItems: RequestItem[];

  // loan for ...
  // ยอดเงิน
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินที่ขอกู้"
  })
  requestBudget: number;

  // เพื่อนำไปประกอบอาชีพ
  @Column(() => EmbeddedOccupation)
  requestOccupation: EmbeddedOccupation;

  // ที่อยู่ในการประกอบอาชีพ
  @Column(() => EmbeddedAddress)
  requestOccupationAddress: EmbeddedAddress;

  // ชื่อธนาคารสำหรับรับโอนเงินกู้
  @Column({
    length: 255,
    default: "",
    comment: `ชื่อธนาคารสำหรับรับโอนเงินกู้ จะทำเป็น list ให้เลือก KTB = "KTB"`
  })
  receiveBankName: bankSet;

  // หมายเลขบัญชีธนาคารสำหรับรับโอนเงินกู้
  @Column({
    length: 32,
    default: "",
    comment: "หมายเลขบัญชีธนาคารสำหรับรับโอนเงินกู้"
  })
  recieveBankAccountNo: string;

  // ชื่อบัญชีธนาคารสำหรับรับโอนเงินกู้
  @Column({
    length: 128,
    default: "",
    comment: "ชื่อบัญชีธนาคารสำหรับรับโอนเงินกู้"
  })
  recieveBankAccountName: string;

  // หมายเลขบัญชีธนาคารสำหรับรับโอนเงินกู้
  @Column({
    length: 32,
    default: "",
    // nullable: true,
    comment: "หมายเลข18หลักที่ต้องใช้โอนเงินให้KTB"
  })
  // @Length(18, 18, {
  //   message: "หมายเลข18หลักที่ต้องใช้โอนเงินให้KTB ไม่ถูกต้อง"
  // })
  recieveBankAccountRefNo: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "จำนวนเงินชำระต่องวด"
  })
  installmentAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "จำนวนเงินชำระงวดสุดท้าย (เศษจากการคำนวนปัดงวดไม่ลงตัว)"
  })
  installmentLastAmount: number;

  @Column({
    default: 1,
    comment: `ระยะเวลาในแต่ละงวด ระบุจำนวนพร้อมหน่วย เช่น 2 เดือน 1 เดือน ใช้คู่กับ installmentPeriodUnit`
  })
  installmentPeriodValue: number;
  @Column({ default: "MONTH", comment: "installmentPeriodValue" })
  installmentPeriodUnit: string;

  @Column({
    default: 5,
    comment: `วันที่ครบกำหนดชำระ เก็บเป็นวันที่ในเดือน ควรอยู่ในช่วง 1 28 ของสบน กำหนดวันที่ 5 ของทุกเดือน`
  })
  installmentPeriodDay: number;

  @Column({
    default: 0,
    comment: "ผ่อนชำระคืนจำนวน x งวด (หน่วยตาม installmentPeriod)"
  })
  installmentTimes: number;

  @Column({ type: "date", nullable: true, comment: "ผ่อนชำระงวดแรกวันที่" })
  installmentFirstDate: Date;
  @Column({
    type: "date",
    nullable: true,
    comment: "ผ่อนชำระงวดสุดท้ายให้เสร็จสิ้นภายในวันที่"
  })
  installmentLastDate: Date;

  // ตารางค่าใข้จ่่าย
  @OneToMany(
    () => BudgetAllocationItem,
    (baItem) => baItem.request,
    {
      cascade: ["insert", "update"]
    }
  )
  budgetAllocationItems: BudgetAllocationItem[];

  // TODO : attachedFileเอกสารแนบ
  // @Column({ type: "simple-array", nullable: true })
  // attachedFileUrls: string[];

  // ตรวจสอบคุณสมบัติ
  @Column({
    type: "simple-json",
    nullable: true,
    comment: "ข้อมูลตรวจสอบคุณสมบัติ"
  })
  validationChecklist: string;

  // แบบสอบข้อเทํ็จจริง
  @OneToOne(() => RequestFactSheet, {
    cascade: ["insert", "update"]
  })
  @JoinColumn()
  factSheet: RequestFactSheet;

  // ผลการอนุมัติ 1
  @Column(() => EmbeddedConsolidation)
  result1: EmbeddedConsolidation;

  // ผลการอนุมัติ 2
  @Column(() => EmbeddedConsolidation)
  result2: EmbeddedConsolidation;

  // ผลการอนุมัติ 3
  @Column(() => EmbeddedConsolidation)
  result3: EmbeddedConsolidation;

  requestBudgetText: string | undefined;
  error: { message: string };

  getRequestBudgetDescription() {
    let requestBudgetDescription = "";
    this.budgetAllocationItems.forEach((ba) => {
      requestBudgetDescription = `${requestBudgetDescription} ${ba.description}`;
    });
    return requestBudgetDescription;
  }

  getIsApproveFromFactsheet() {
    return this.factSheet.isApproved ? "สมควร" : "ไม่สมควร";
  }

  setAge() {
    try {
      // this.requestItems.forEach((ri) => {
      //   ri.setAge(this.documentDate);
      // });
      this.requestItems.forEach((ri) => {
        if (ri.borrower) {
          ri.borrower.setAge(this.documentDate);
        }
        if (ri.guarantor) {
          ri.guarantor.setAge(this.documentDate);
        }
        if (ri.spouse) {
          ri.spouse.setAge(this.documentDate);
        }
      });
    } catch (e) {
      throw e;
    }
  }

  getTotalBudget() {
    let total = 0.0;
    if (this.budgetAllocationItems) {
      this.budgetAllocationItems.forEach((ba) => {
        // total += +ba.subTotal;
        total += +ba.cost * +ba.quality;
      });
    }
    return total;
  }

  setThaiFormatForReport() {
    this.documentDate = getThaiPartialDate(this.documentDate);
    this.requestItems.forEach((ri) => {
      if (ri.borrower) {
        const tempMarriageStatus = ri.borrower.marriageStatus;
        ri.borrower.setThaiFormatForReport();
        ri.borrower.marriageStatus = tempMarriageStatus;
      }
      ri.spouse.fullName = fullNameFormatting(
        ri.spouse.title,
        ri.spouse.firstname,
        ri.spouse.lastname
      );
      ri.spouse.idCardNo = idcardFormatting(ri.spouse.idCardNo);
      ri.spouse.idCardExpireDate = getThaiPartialDate(
        ri.spouse.idCardExpireDate
      );

      if (ri.guarantor) {
        const tempMarriageStatus = ri.guarantor.marriageStatus;
        ri.guarantor.setThaiFormatForReport();
        ri.guarantor.marriageStatus = tempMarriageStatus;
      }
    });
    this.requestBudgetText =
      this.requestBudget > 0 && convertFullMoney(Number(this.requestBudget));

    this.status = getEnumSetText("requestStatus", this.status);
    this.result1.setThaiFormatForReport();
    this.result2.setThaiFormatForReport();
    this.result3.setThaiFormatForReport();

    if (this.factSheet) {
      this.factSheet.setThaiFormatForReport();
    }
  }

  getDurationYear() {
    if (this.installmentPeriodUnit === "MONTH") {
      return Math.floor(
        (this.installmentPeriodValue * this.installmentTimes) / 12
      );
    }
  }
  getDurationMonth() {
    if (this.installmentPeriodUnit === "MONTH") {
      return (this.installmentPeriodValue * this.installmentTimes) % 12;
    }
  }

  getPassedQualificationStatus() {
    if (this.factSheet) {
      return (
        this.factSheet.borrowerScore > 65 && this.factSheet.guarantorScore > 65
      );
    }
    return false;
  }

  getCurrentResult() {
    switch (this.status) {
      case "AP1":
        return this.result1;
      case "AP2":
        return this.result2;
      case "AP3":
        return this.result3;
      case "DN":
        return this.result3;
      default:
        return null;
    }
  }

  // ผลการพิจารณา
  getConsiderationResult() {
    switch (this.status) {
      case "AP1":
        if (this.result1.result === "AP" || this.result1.result === "AJ") {
          return "สมควรให้กู้ยืม";
        } else {
          return "ไม่สมควรให้กู้ยืม";
        }
      case "AP2":
        if (this.result2.result === "AP" || this.result2.result === "AJ") {
          return "สมควรให้กู้ยืม";
        } else {
          return "ไม่สมควรให้กู้ยืม";
        }
      case "AP3":
        if (this.result3.result === "AP" || this.result3.result === "AJ") {
          return "สมควรให้กู้ยืม";
        } else {
          return "ไม่สมควรให้กู้ยืม";
        }
      case "DN":
        if (this.result3.result === "AP" || this.result3.result === "AJ") {
          return "สมควรให้กู้ยืม";
        } else {
          return "ไม่สมควรให้กู้ยืม";
        }
      default:
        return "ยังไม่เข้าคณะพิจารณา";
    }
  }

  // getConsideringBudget() {
  //   switch (this.status) {
  //     case "QF":
  //       return this.requestBudget;
  //     case "AP1":
  //       return this.result1.approveBudget;
  //     case "AP2":
  //       return this.result2.approveBudget;
  //     case "AP3":
  //       return this.result3.approveBudget;
  //     case "DN":
  //       return this.result3.approveBudget;
  //     default:
  //       return 0;
  //   }
  // }

  // หมายเหตุการพิจารณา
  getResultComments() {
    switch (this.status) {
      case "AP1":
        return this.result1.comments;
      case "AP2":
        return this.result2.comments;
      case "AP3":
        return this.result3.comments;
      case "DN":
        return this.result3.comments;
      default:
        return "-";
    }
  }

  getRecieveBankAccountRefNo() {
    const length = this.recieveBankAccountNo.length;
    const position = length - 11;
    let recieveBankAccountRefNo = "";
    let sendingBankCode = "";
    let sendingBranchCode = "";
    let recieveBankAccountNo = "";
    if (position > 0) {
      sendingBranchCode = this.recieveBankAccountNo.substr(0, position);
      recieveBankAccountNo = this.recieveBankAccountNo.substr(position);
    } else {
      recieveBankAccountNo = this.recieveBankAccountNo;
    }
    if (this.receiveBankName === bankSet.KTB) {
      sendingBankCode = "006";
    } else {
      sendingBankCode = this.receiveBankName;
    }
    recieveBankAccountRefNo = `${sendingBankCode.padStart(
      3,
      "0"
    )}${sendingBranchCode.padStart(4, "0")}${recieveBankAccountNo.padStart(
      11,
      "0"
    )}`;

    return recieveBankAccountRefNo;
  }

  validateReceiveBankData() {
    if (!this.receiveBankName) {
      return false;
    }

    return true;
  }

  @BeforeInsert()
  private async doSomethingBeforeInsert() {
    try {
      if (this.requestType === loanTypeSet.personal && this.requestItems) {
        this.name = this.requestItems[0]
          ? this.requestItems[0].getBorrowerFullname()
          : "";
      }
      this.setAge();
    } catch (e) {
      throw e;
    }
  }

  @BeforeUpdate()
  private async doSomethingBeforeUpdate() {
    try {
      if (this.status === requestStatusSet.approve3) {
        await validateFields(this);
      }
      if (this.requestType === loanTypeSet.personal && this.requestItems) {
        this.name = this.requestItems[0]
          ? this.requestItems[0].getBorrowerFullname()
          : "";
      }
      this.setAge();
    } catch (e) {
      throw e;
    }
  }
}
