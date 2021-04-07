import { Column, Entity, ManyToOne } from "typeorm";
import { creditStatusSet } from "../enumset";
import { AccountReceivable } from "./AccountReceivable";
import { BaseEntity } from "./inherited/BaseEntity";

@Entity("account_receivable_controls")
export class AccountReceivableControl extends BaseEntity {
  @Column({ nullable: false, comment: "บัญชีลูกหนี้" })
  accountReceivableId: number;
  @ManyToOne(
    () => {
      return AccountReceivable;
    },
    (ar) => ar.controls,
    {
      onDelete: "CASCADE"
    }
  )
  accountReceivable: AccountReceivable;

  @Column({
    type: "datetime",
    nullable: true,
    comment: "ข้อมูลประมวนผล ณ วันที่"
  })
  asOfDate: Date | string;

  @Column({
    length: 48,
    // unique: true,
    comment: "เลขที่บัญชี"
  })
  sourceARDocumentNumber: string;

  @Column({ type: "date", nullable: true, comment: "ผ่อนชำระงวดแรกวันที่" })
  sourceARInstallmentFirstDate: Date | string;

  @Column({
    type: "date",
    nullable: true,
    comment: "ผ่อนชำระงวดสุดท้ายให้เสร็จสิ้นภายในวันที่"
  })
  sourceARInstallmentLastDate: Date | string;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "จำนวนเงินชำระต่องวด"
  })
  sourceARInstallmentAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินกู้"
  })
  sourceARLoanAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินที่ชำระแล้วทั้งหมด"
  })
  sourceARTTotalPaidAmount: number;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่ชำระครั้งล่าสุด"
  })
  sourceARTLastPaidDate: Date | string;

  @Column({
    type: "date",
    nullable: true,
    comment: "จำนวนวันที่ควรชำระงวดล่าสุด"
  })
  expectedLastPaidDate: Date | string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดคงเหลือล่าสุด (หนี้คงค้าง)"
  })
  outstandingDebtBalance: number;

  @Column({
    default: 0,
    comment: "จำนวนงวดที่ต้องจ่าย  ณ วันที่รัน script"
  })
  expectedPaidTimes: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "จำนวนเงินที่ต้องจ่าย ณ วันที่รัน script"
  })
  expectedPaidAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment:
      "จำนวนเงินคงค้างที่เลยกำหนดชำระ คำนวนจาก expectedPaidAmount - totalPaidAmount"
  })
  overDueBalance: number;

  @Column({
    default: 0,
    comment: "จำนวนวันที่เลยกำหนดชำระ"
  })
  overDueDay: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment:
      "อัตราการชำระหนี้เทียบกับที่หนี้ที่ควรจะต้องจ่าย ณ งวดปัจจุบัน คิดเป็น% = totalPaidAmount/ expectedPaidAmount หนี้ที่ควรจะจ่าย ณ​ ปัจจุบัน  "
  })
  paidRatio: number | string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment:
      "สัดส่วนการชำระหนี้ ว่าชำหนี้ทั้งหมดมาแล้วกี่% = (LoanAmount - outstandingDebtBalance)/LoanAmount"
  })
  paidPercentage: number | string;

  @Column({
    default: creditStatusSet.overdue0,
    comment: "สถานนะค้างชำระ ตามกฎหมาย นับจากวันที่เริ่มผิดนัดชำระ"
  })
  status: creditStatusSet;

  // จำนวนงวดค้างชำระ คำนวนได้จาก overDueBalance / installmentAmount หารไม่เอาเศษ
  paidInstallmentCount: number;

  get overDueInstallmentTimes() {
    return this.overDueBalance / this.accountReceivable.installmentAmount;
  }
}
