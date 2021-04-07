import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany
} from "typeorm";

import moment = require("moment");
import { accountReceiviableStatusSet, agreementStatusSet } from "../enumset";
import { getThaiPartialDate } from "../utils/datetime-helper";
import { phoneNumberFormatting } from "../utils/format-helper";
import { AccountReceivableControl } from "./AccountReceivableControl";
import { AccountReceivableTransaction } from "./AccountReceivableTransaction";
import { Agreement } from "./Agreement";
import { AttachedFile } from "./AttachedFile";
import { DebtCollection } from "./DebtCollection";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { EmbeddedDebtAcknowledgement } from "./embedded/EmbeddedDebtAcknowledgement";
import { Guarantee } from "./Guarantee";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";

@Entity("account_receivables")
export class AccountReceivable extends BaseEntity {
  @Column({ nullable: false, comment: "หน่วยงานที่สร้างบัญชีลูกหนี้" })
  organizationId: number;
  @ManyToOne(() => Organization, { nullable: false })
  organization: Organization;

  @Column({ default: "", comment: "รหัสอ้างอิงสำหรับออกรายงานแบบ force" })
  refReportCode: string;

  @Column({ default: "", comment: "ปีงบประมาณ" })
  fiscalYear: string;

  @Column({ nullable: true, comment: "รหัสสัญญา" })
  agreementId: number;
  @ManyToOne(() => Agreement, {})
  @JoinColumn()
  agreement: Agreement;

  @Column({ nullable: true, comment: "สัญญาค้ำประกัน" })
  guaranteeId: number;
  @ManyToOne(() => Guarantee, {})
  @JoinColumn()
  guarantee: Guarantee;

  @Column({
    type: "date",
    nullable: true,
    comment:
      "วันที่เริ่มบัญชี : บัญชีแรกจะตรงกับวันที่ทำสัญญา agreement.documentDate"
  })
  documentDate: Date | string;

  @Column({
    length: 48,
    // unique: true,
    comment:
      "เลขที่สัญญา : กรณีที่ลูกค้ามี account เดียว เลขที่เอกสารจะตรงกับสัญญา"
  })
  documentNumber: string;

  @Column({
    length: 48,
    default: "",
    comment: "หมายเลขอ้างอิงภายใน : ของผสให้กรอกรหัสผู้กู้"
  })
  internalRef: string;

  // สถานะบัญชีลูกหนี้
  @Column({
    default: accountReceiviableStatusSet.normal,
    comment: ` สถานะบัญชีลูกหนี้ normal = "10" ปกติ, unpaid = "20" ค้างจ่าย, sue = "30" อยู่ในกระบวนการทางกฎหมาย, close = "11" ปิดบัญชี, badDebt = "33" ปิดบัญชีเนื่องจากตัดเป็นหนี้สูญ`
  })
  status: accountReceiviableStatusSet;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่เริ่มบัญชี : ปกติจะตรงกับ documentDate"
  })
  startDate: Date | string;

  @Column({
    type: "date",
    nullable: true,
    comment:
      "วันที่สิ้นสุดบัญชี : ตรงกับวันสุดทั้ายที่ผ่อนชำระในสัญญา agreement.installmentLastDate"
  })
  endDate: Date | string;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่ปิดบัญชี : คือวันที่เปลี่ยนสถานะเป็นปิดบัญชี"
  })
  closeDate: Date;

  @Column({
    length: 255,
    default: "",
    comment:
      "ตามชื่อคำร้อง ถ้าเป็นแบบกลุ่มใส่ชื่อกลุ่ม ถ้าแบบรายบุคคลใส่ {title}{firstname} {lastname}"
  })
  name: string;

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

  // ระยะเวลาในแต่ละงวด ระบุจำนวนพร้อมหน่วย
  // เช่น 2 เดือน ต่อ 1 เดือน ใช้คู่กับ installmentPeriodUnit
  @Column({
    default: 1,
    comment: `ระยะเวลาในแต่ละงวด ระบุจำนวนพร้อมหน่วย  เช่น 2 เดือน ต่อ 1 เดือน ใช้คู่กับ installmentPeriodUnit`
  })
  installmentPeriodValue: number;
  @Column({ default: "MONTH", comment: "installmentPeriodValue" })
  installmentPeriodUnit: string;

  @Column({
    default: 5,
    comment: `วันที่ครบกำหนดชำระ เก็บเป็นวันที่ในเดือน ควรอยู่ในช่วง 1-28  ของผส กำหนดวันที่ 5 ของทุกเดือน`
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

  @Column(() => EmbeddedAddress)
  borrowerContactAddress: EmbeddedAddress;

  @Column({ length: 64, default: "" })
  borrowerContactTelephone: string;

  @Column(() => EmbeddedAddress)
  guarantorContactAddress: EmbeddedAddress;

  @Column({ length: 64, default: "" })
  guarantorContactTelephone: string;

  // ข้อมูลการชำระเงินกู้
  @OneToMany(
    () => AccountReceivableTransaction,
    (arTransaction) => arTransaction.accountReceivable,
    {
      cascade: ["insert", "update"]
    }
  )
  transactions: AccountReceivableTransaction[];

  // ข้อมูลสำหรับติดตามหนี้สิน
  @OneToMany(
    () => DebtCollection,
    (collection) => collection.accountReceivable,
    {
      cascade: ["insert", "update"]
    }
  )
  collections: DebtCollection[];

  // ช้อมูลการรับสภาพหนี้สำหรับบัญชี AR ที่สร้างใหม่จากการยอมรับสภาพหนี้จากบัญชีเดิม
  @Column(() => EmbeddedDebtAcknowledgement)
  debtAcknowledgement: EmbeddedDebtAcknowledgement;

  // ข้อมูลคุมบัญชีลูกหนี้
  @OneToMany(
    () => AccountReceivableControl,
    (arControl) => arControl.accountReceivable,
    {
      cascade: ["insert", "update"]
    }
  )
  controls: AccountReceivableControl[];

  @Column({ type: "date", nullable: true, comment: "วันที่ชำระล่าสุด" })
  lastPaymentDate: Date | string;
  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่จะเริ่มนับว่ามีการผิดนัดชำระครั่้งถัดไป"
  })
  tentativeOverdueDate: Date | string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดคงเหลือล่าสุด (หนี้คงค้าง)"
  })
  outstandingDebtBalance: number;

  // หมายเหตุ
  @Column({ default: "", comment: "หมายเหตุ" })
  comments: string;

  collection: DebtCollection;
  control: AccountReceivableControl;
  // วันที่เริ่มมีการผิดนัดชำระ
  startOverdueDate: Date | string;

  caseExpirationDate: Date | string;

  // ใช้ตอนสร้างลูกหนี้
  agreementInstallmentFirstDate: Date | string;
  agreementInstallmentLastDate: Date | string;

  atfs: AttachedFile[];

  @AfterLoad()
  doSomethingAfterLoad() {
    const today = moment(new Date()).format("YYYY-MM-DD");
    this.startOverdueDate =
      this.tentativeOverdueDate && this.tentativeOverdueDate < today
        ? this.tentativeOverdueDate
        : null;
    if (this.startOverdueDate) {
      this.caseExpirationDate = this.getCaseExpirationDate();
    }
    if (this.atfs) {
      this.debtAcknowledgement.attachedFiles = this.atfs;
      delete this.atfs;
    }
  }

  setThaiFormatForReport() {
    this.borrowerContactTelephone = phoneNumberFormatting(
      this.borrowerContactTelephone
    );
    this.installmentFirstDate = getThaiPartialDate(this.installmentFirstDate);
    if (this.agreement) {
      this.agreement.setThaiFormatForReport();
    }
    if (this.guarantee) {
      this.guarantee.setThaiFormatForReport();
    }
    if (this.organization) {
      this.organization.setThaiFormatForReport();
    }
  }

  updatePaymentData(
    newOutstandingDebtBalance: number,
    paidDate: Date | string
  ) {
    this.outstandingDebtBalance = newOutstandingDebtBalance;
    this.lastPaymentDate = paidDate;
    this.calculateTentative();
    // ถ้าจ่ายหมดให้ปิดบัญชีลูกหนี้และสัญญาเงินกู้
    if (newOutstandingDebtBalance === 0) {
      this.status = accountReceiviableStatusSet.close;
      if (this.agreement) {
        this.agreement.updateStatus(agreementStatusSet.close, paidDate as Date);
      }
    }
  }

  revertPaymentData(
    newOutstandingDebtBalance: number,
    prevPaidDate: Date | string, // เอามาจากไหน
    isClosed?: boolean
  ) {
    this.outstandingDebtBalance = newOutstandingDebtBalance;
    this.lastPaymentDate = prevPaidDate;
    this.calculateTentative();
    this.calculateRevertARStatus(isClosed);
    if (this.agreement) {
      this.agreement.updateStatus(agreementStatusSet.done, null);
    }
  }

  @BeforeInsert()
  private doSomethingBeforeInsert() {
    try {
      if (this.agreementInstallmentFirstDate) {
        this.installmentFirstDate = this.agreementInstallmentFirstDate;
        this.startDate = this.agreementInstallmentFirstDate;
      }
      if (this.agreementInstallmentLastDate) {
        this.installmentLastDate = this.agreementInstallmentLastDate;
        this.endDate = this.agreementInstallmentLastDate;
      }
    } catch (e) {
      throw e;
    }
  }

  calculateTentative() {
    // คำนวณงวดที่ชำระไปแล้ว
    const paidInstallmentCount = Math.floor(
      (this.loanAmount - this.outstandingDebtBalance) / this.installmentAmount
    );

    const installmentFirstDate = moment(this.installmentFirstDate);

    if (this.installmentPeriodUnit === "MONTH") {
      this.tentativeOverdueDate = installmentFirstDate
        .add(paidInstallmentCount * this.installmentPeriodValue, "month")
        .format("YYYY-MM-DD");
    }
  }
  calculateRevertARStatus(isClosed: boolean) {
    if (isClosed) {
      this.status = accountReceiviableStatusSet.close;
      return;
    }
    const isCollection =
      this.collection && +this.collection.step === 3 ? true : false;
    if (isCollection) {
      this.status = accountReceiviableStatusSet.collection;
    } else {
      const lastPaymentDate = moment(this.lastPaymentDate);
      const isOver90 = moment().diff(lastPaymentDate, "day") > 90;
      if (isOver90) {
        this.status = accountReceiviableStatusSet.unpaid;
      } else {
        this.status = accountReceiviableStatusSet.normal;
      }
    }
  }
  getCaseExpirationDate() {
    if (
      this.collection &&
      this.collection.deathNotification &&
      this.collection.deathNotification.isConfirm
    ) {
      const date = moment(this.collection.deathNotification.notificationDate);
      return date.add(1, "year").format("YYYY-MM-DD");
    } else {
      const date = moment(this.startOverdueDate);
      return date.add(5, "year").format("YYYY-MM-DD");
    }
  }

  getDurationYear() {
    if (this.installmentPeriodUnit === "MONTH") {
      return Math.floor(
        (this.installmentPeriodValue * this.installmentTimes) / 12
      ).toString();
    }
  }
  getDurationMonth() {
    if (this.installmentPeriodUnit === "MONTH") {
      return (
        (this.installmentPeriodValue * this.installmentTimes) %
        12
      ).toString();
    }
  }
}
