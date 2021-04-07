import { Column, Entity, ManyToOne } from "typeorm";
import { officePaymentMethodSet, POSShiftLogActionSet } from "../enumset";
import { BaseEntity } from "./inherited/BaseEntity";
import { PosShift } from "./PosShift";

@Entity("pos_shift_logs")
export class PosShiftLogs extends BaseEntity {
  @Column({ nullable: false, comment: "รหัสรอบการทำงานของจุดรับชำระ" })
  posShiftId: number;
  @ManyToOne(() => PosShift, { onDelete: "CASCADE" })
  posShift: PosShift;

  @Column({
    default: officePaymentMethodSet.cash,
    comment: `รูปแบบ action open = "OPEN" เปิดรอบการทำงาน, close="CLOSE" ปิดรอบการทำงาน, count_cash = "COUNT" นับเงินในลิ้นชัก, add_cash="ADD" เติมเงินเข้าลิ้นชัก, drop_cash = "DROP" ชักเงินออกจากลิ้นชัก, cashier_login = "LOGIN", cashier_logout = "LOGOUT", swap_manager = "SWAPMNG",swap_cashier = "SWAPCSH"`
  })
  action: POSShiftLogActionSet;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินเข้า/ออก (+/-)"
  })
  transactionAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินโดยรวม"
  })
  expectedDrawerAmount: number;

  @Column({ length: 512, default: "", comment: "หมายเหตุ" })
  note: string;
  // เอกสารอ้างอิงรายการชำระ
  @Column({
    length: 16,
    nullable: true,
    comment: `เอกสารอ้างอิงรายการชำระ : RECEIPT`
  })
  refType: string;
  @Column({
    nullable: true,
    comment: `เอกสารอ้างอิงรายการชำระ ใช้คู่กับ refType RECEIPT.Id `
  })
  refId: number;
}
