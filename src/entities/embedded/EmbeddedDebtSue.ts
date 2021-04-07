import { Column } from "typeorm";
import { AttachedFile } from "../AttachedFile";

export class EmbeddedDebtSue {
  @Column({ default: false, comment: "อนุมัติฟ้อง" })
  isApprovedSue: boolean;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่ยืนฟ้องศาล"
  })
  submitDate: Date;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่ศาลพิพากษา"
  })
  judgementDate: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "เงินต้นที่ส่งฟ้อง"
  })
  debtAmount: number;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่เริ่มคิดดอกเบี๊ย"
  })
  interestStartDate: Date;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่สิ้นสุดการคิดดอกเบี๊ย"
  })
  interestEndDate: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ดอกเบี้ย %"
  })
  interestRate: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ดอกเบี้ยทั้งหมด ณ วันที่กำหนด (default = today)"
  })
  interestAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดหนี้รวมทั้งหมด"
  })
  totalDebtAmount: number;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่เริ่มคิดดอกเบี๊ย"
  })
  judgementInterestStartDate: Date;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่สิ้นสุดการคิดดอกเบี๊ย"
  })
  judgementInterestEndDate: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ดอกเบี้ยตามคำสั่งศาล (%)"
  })
  judgementInterestRate: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ดอกเบี้ยตามคำสั่งศาล"
  })
  judgementInterestAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "หนี้ตามคำพิพากษา"
  })
  judgementBalance: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดหนี้รวมตามคำพิพากษา"
  })
  judgementTotalDebtAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ค่าทนาย"
  })
  lawyerFee: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ค่าฤชาธรรมเนียม"
  })
  fee: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ค่าใช้จ่ายอื่นๆ"
  })
  otherExpense: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดรวมทั้งหมดจากการดำเนินคดี"
  })
  totalAmount: number;

  attachedFiles: AttachedFile[];
}
