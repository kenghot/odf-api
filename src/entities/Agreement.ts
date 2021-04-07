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

import moment = require("moment");
import { agreementStatusSet, loanTypeSet } from "../enumset";
import { idcardFormatting, fullNameFormatting } from "../utils/format-helper";
import { convertFullMoney } from "../utils/money-to-thai-text";
import { convertIntToText } from "../utils/number-to-thai-text";
import { AgreementItem } from "./AgreementItem";
import { EmbeddedAddressShort } from "./embedded/EmbeddedAddressShort";
import { Guarantee } from "./Guarantee";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { Request } from "./Request";
import { Voucher } from "./Voucher";

@Entity("agreements")
export class Agreement extends BaseEntity {
  @Column({ nullable: false, comment: "หน่วยงานที่ทำสัญญา" })
  organizationId: number;
  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({ default: "", comment: "รหัสอ้างอิงสำหรับออกรายงานแบบ force" })
  refReportCode: string;

  @Column({ default: "", comment: "ปีงบประมาณ" })
  fiscalYear: string;

  @Column({ type: "date", nullable: true, comment: "วันที่ทำสัญญา" })
  documentDate: Date | string;

  @Column({ length: 48, unique: true, comment: "เลขที่สัญญา" })
  documentNumber: string;

  @Column({
    comment: `ประเภท รายบุคคล หรือ กลุ่ม personal = "P", group = "G"`
  })
  agreementType: loanTypeSet;

  @Column({
    length: 255,
    default: "",
    comment:
      "ตามชื่อคำร้อง ถ้าเป็นแบบกลุ่มใส่ชื่อกลุ่ม ถ้าแบบรายบุคคลใส่ {title}{firstname} {lastname}"
  })
  name: string;
  // สถานะสัญญา
  // new = "NW",  เตรียมทำสัญญา
  // duringPayment = "DP", รอโอนเงิน
  // failPayment = "FP", โอนเงินไม่สำเร็จ
  // done = "DN",  ทำสัญญาแล้ว  // วันที่ทำสัญญาจะตรงกับ documentDate
  // disclaim = "DC", สละสิทธิ์
  // cancel = "CL", ยกเลิก
  // close = "CS", ปิด
  // adjusted = "AJ" ปรับสภาพหนี้
  @Column({
    default: agreementStatusSet.new,
    comment: `สถานะสัญญา new = "NW",  เตรียมทำสัญญา duringPayment = "DP", รอโอนเงิน failPayment = "FP", โอนเงินไม่สำเร็จ done = "DN",  ทำสัญญาแล้ว  // วันที่ทำสัญญาจะตรงกับ documentDate disclaim = "DC", สละสิทธิ์ cancel = "CL" ยกเลิก close = "CS", ปิด adjusted = "AJ" ปรับสภาพหนี้`
  })
  status: agreementStatusSet;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่เริ่มสัญญา: ปกติจะตรงกับวันที่ documentDate"
  })
  startDate: Date;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่สิ้นสุดสัญญา: ให้นับไป 3 ปีจากวันที่ทำสัญญา"
  })
  endDate: Date | string;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่โอนเงิน : คือวันที่ทำรายการโอนเงินให้ลูกหนี้"
  })
  loanPaymentDate: Date;

  @Column({ type: "date", nullable: true, comment: "วันทีสละสิทธิ" })
  disclaimDate: Date;

  @Column({ type: "date", nullable: true, comment: "วันทียกเลิกสัญญา" })
  cancelDate: Date;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันทีปิดบัญชีทั้งหมดภายใตัสัญญา"
  })
  closeDate: Date;

  @Column({ nullable: true, comment: "รหัสคำร้อง" })
  requestId: number;
  @OneToOne(() => Request, {})
  @JoinColumn()
  request: Request;

  @Column({
    length: 255,
    default: "",
    comment: "สถานที่ทำสัญญา ดึงข้อมูลอัตโนมัตจาก request.requestLocation"
  })
  signLocation: string;

  @Column(() => EmbeddedAddressShort)
  signLocationAddress: EmbeddedAddressShort;

  @Column({ length: 128, default: "", comment: "ผู้มีอำนาจลงนาม : คำนำหหน้า" })
  agreementAuthorizedTitle: string;

  @Column({ length: 128, default: "", comment: "ผู้มีอำนาจลงนาม : ชื่อ" })
  agreementAuthorizedFirstname: string;

  @Column({ length: 128, default: "", comment: "ผู้มีอำนาจลงนาม : นามสกุล" })
  agreementAuthorizedLastname: string;

  @Column({ length: 128, default: "", comment: "ผู้มีอำนาจลงนาม : ตำแหน่ง" })
  agreementAuthorizedPosition: string;

  @Column({
    length: 128,
    default: "",
    comment: "ผู้มีอำนาจลงนาม : คำสั่งเลขที่"
  })
  agreementAuthorizedCommandNo: string;

  @Column({
    type: "date",
    nullable: true,
    comment: "ผู้มีอำนาจลงนาม : คำสั่งลงวันที่"
  })
  agreementAuthorizedCommandDate: Date;

  // ข้อมูลผู้กูและผู้ค้ำ
  @OneToMany(
    () => AgreementItem,
    (agreementItem) => agreementItem.agreement,
    {
      cascade: ["insert", "update"]
    }
  )
  agreementItems: AgreementItem[];

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินกู้"
  })
  loanAmount: number;

  @Column({ length: 4, default: "", comment: "กำหนดเวลาผ่อนชำระ หน่วย:ปี" })
  loanDurationYear: string;

  @Column({
    length: 4,
    default: "",
    comment: "กำหนดเวลาผ่อนชำระ หน่วย:เดือน >> ดูคู่กันกับ loanDurationYear"
  })
  loanDurationMonth: string;

  // สัญญาค้ำประกัน
  @Column({ nullable: true, comment: "สัญญาค้ำประกัน" })
  guaranteeId: number;
  @OneToOne(
    () => Guarantee,
    (guarantee) => guarantee.agreement,
    {
      cascade: ["insert", "update"]
    }
  )
  @JoinColumn()
  guarantee: Guarantee;

  @Column({ length: 48, nullable: true, comment: "เลขที่สัญญาค้ำประกัน" })
  guaranteeDocumentNumber: string;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่ลงในสัญญาค้ำประกัน"
  })
  guaranteeDocumentDate: Date | string;

  @Column({ length: 255, default: "", comment: "สถานที่ชำระเงินกู้" })
  loanPaymentLocation: string;

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
    comment: `ระยะเวลาในแต่ละงวด ระบุจำนวนพร้อมหน่วย เช่น 2 เดือน  1 เดือน ใช้คู่กับ installmentPeriodUnit`
  })
  installmentPeriodValue: number;
  @Column({ default: "MONTH", comment: "installmentPeriodValue" })
  installmentPeriodUnit: string;

  @Column({
    default: 5,
    comment: `วันที่ครบกำหนดชำระ เก็บเป็นวันที่ในเดือน ควรอยู่ในช่วง1 ถึง 28  ผส กำหนดวันที่ 5 ของทุกเดือน`
  })
  installmentPeriodDay: number;

  @Column({
    default: 0,
    comment: "ผ่อนชำระคืนจำนวน x งวด (หน่วยตาม installmentPeriod)"
  })
  installmentTimes: number;

  @Column({ type: "date", nullable: true, comment: "ผ่อนชำระงวดแรกวันที่" })
  installmentFirstDate: Date | string;

  @Column({
    type: "date",
    nullable: true,
    comment: "ผ่อนชำระงวดสุดท้ายให้เสร็จสิ้นภายในวันที่"
  })
  installmentLastDate: Date | string;

  @Column({ default: "", comment: "เหตุผลในการยกเลิกสัญญา" })
  agreementCancelReason: string;

  @Column({ length: 255, default: "", comment: "พยานคนที่1" })
  witness1: string;

  @Column({ length: 255, default: "", comment: "พยานคนที่2" })
  witness2: string;

  @Column({ default: false })
  isAudited: boolean;
  @Column({ type: "text", nullable: true })
  auditRemarks: string;

  loanAmountText: string | undefined;
  loanDurationYearText: string | undefined;
  loanDurationMonthText: string | undefined;
  installmentAmountText: string | undefined;
  installmentTimesAttached: number | undefined;
  agreementAuthorizedFullName: string | undefined;
  error: { message: string };
  voucher: Voucher;
  installmentLastAmountText: string | undefined;

  setAge() {
    try {
      this.agreementItems.forEach((ai) => {
        if (ai.borrower) {
          ai.borrower.setAge(this.documentDate);
        }
        if (ai.guarantor) {
          ai.guarantor.setAge(this.documentDate);
        }
      });
    } catch (e) {
      throw e;
    }
  }

  setThaiFormatForReport() {
    this.agreementItems.forEach((ai) => {
      ai.borrower.idCardNo = idcardFormatting(ai.borrower.idCardNo);
      ai.borrower.fullName = fullNameFormatting(
        ai.borrower.title,
        ai.borrower.firstname,
        ai.borrower.lastname
      );
      if (ai.guarantor) {
        ai.guarantor.idCardNo = idcardFormatting(ai.guarantor.idCardNo);
        ai.guarantor.fullName = fullNameFormatting(
          ai.guarantor.title,
          ai.guarantor.firstname,
          ai.guarantor.lastname
        );
      }
    });
    this.agreementAuthorizedFullName = fullNameFormatting(
      this.agreementAuthorizedTitle,
      this.agreementAuthorizedFirstname,
      this.agreementAuthorizedLastname
    );
    this.loanAmountText =
      this.loanAmount > 0 && convertFullMoney(Number(this.loanAmount));
    this.loanDurationYearText = convertIntToText(Number(this.loanDurationYear));
    this.loanDurationMonthText = convertIntToText(
      Number(this.loanDurationMonth)
    );
    if (this.installmentAmount) {
      this.installmentAmountText = convertFullMoney(
        Number(this.installmentAmount)
      );
    }
    if (+this.installmentLastAmount === 0) {
      this.installmentLastAmount = 0;
      this.installmentTimesAttached = +this.installmentTimes;
    } else {
      this.installmentLastAmountText =
        this.installmentLastAmount > 0 &&
        convertFullMoney(Number(this.installmentLastAmount));
      this.installmentTimesAttached = +this.installmentTimes - 1;
    }
    if (this.guarantee) {
      this.guarantee.setThaiFormatForReport();
    }
  }

  setName() {
    if (
      this.agreementType === loanTypeSet.personal &&
      this.agreementItems &&
      this.agreementItems[0] &&
      this.agreementItems[0].borrower
    ) {
      this.name = `${this.agreementItems[0].borrower.title}${this.agreementItems[0].borrower.firstname} ${this.agreementItems[0].borrower.lastname}`;
    }
  }

  updateStatus(status: agreementStatusSet, date: Date) {
    this.closeDate = date;
    this.status = status;
  }

  @BeforeInsert()
  private doSomethingBeforeInsert() {
    try {
      // if (!this.name) {
      //   this.setName();
      // }
      if (this.agreementType === loanTypeSet.personal && this.agreementItems) {
        this.name = this.agreementItems[0]
          ? this.agreementItems[0].getBorrowerFullname()
          : "";
      }
      // this.setAge();
    } catch (e) {
      throw e;
    }
  }

  @BeforeUpdate()
  private doSomethingBeforeUpdate() {
    try {
      // this.setName();
      if (this.agreementType === loanTypeSet.personal && this.agreementItems) {
        this.name = this.agreementItems[0]
          ? this.agreementItems[0].getBorrowerFullname()
          : "";
      }
      // this.setAge();

      const installmentFirstDate = moment(this.installmentFirstDate);
      const loanPaymentDate = moment(this.loanPaymentDate);

      // check condition to calculate new date
      if (loanPaymentDate.isAfter(installmentFirstDate)) {
        const installmentFirstMonth =
          moment(installmentFirstDate).get("month") + 1;
        const installmentFirstYear = moment(installmentFirstDate).get("year");
        const tempInstallmentFirstDate = moment(
          `${installmentFirstYear}-${installmentFirstMonth
            .toString()
            .padStart(2, "0")}-${this.installmentPeriodDay
            .toString()
            .padStart(2, "0")}`
        );

        if (this.installmentPeriodUnit === "MONTH") {
          const durationFirst =
            loanPaymentDate.diff(installmentFirstDate, "month") + 1;
          const durationToLast =
            this.installmentTimes * this.installmentPeriodValue;
          const newInstallmentFirstDate = tempInstallmentFirstDate.add(
            durationFirst,
            "month"
          );
          this.installmentFirstDate = newInstallmentFirstDate.format(
            "YYYY-MM-DD"
          );
          this.installmentLastDate = newInstallmentFirstDate
            .add(durationToLast, "month")
            .format("YYYY-MM-DD");
          this.endDate = this.installmentLastDate;
        }
      }
    } catch (e) {
      throw e;
    }
  }
}
