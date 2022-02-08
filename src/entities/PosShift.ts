import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./inherited/BaseEntity";
import { Pos } from "./Pos";
import { PosShiftLogs } from "./PosShiftLog";
import { User } from "./User";

@Entity("pos_shifts")
export class PosShift extends BaseEntity {
  @Column({ nullable: false, comment: "รหัสจุดรับชำระ" })
  posId: number;
  @ManyToOne(() => Pos, { onDelete: "CASCADE" })
  pos: Pos;

  @Column({
    nullable: true,
    comment: "วันเวลาเริ่มรอบการทำงาน",
    type: "datetime"
  })
  startedShift: string;
  @Column({
    nullable: true,
    comment: "วันเวลาปิดรอบการทำงาน",
    type: "datetime"
  })
  endedShift: string;

  @Column({ nullable: true, comment: "ผู้ดูแลการรับชำระ" })
  onDutymanagerId: number;
  @ManyToOne(() => User)
  onDutymanager: User;

  @Column({ nullable: true, comment: "เจ้าหน้าที่ประจำจุดรับชำระ" })
  currentCashierId: number;
  @ManyToOne(() => User)
  currentCashier: User;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินเปิดรอบ"
  })
  openingAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินที่คาดว่าจะมีในลิ้นชัก"
  })
  expectedDrawerAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินจริงในลิ้นชัก"
  })
  drawerAmount: number;

  @OneToMany(
    () => PosShiftLogs,
    (log) => log.posShift,
    {
      cascade: ["insert", "update"]
    }
  )
  logs: PosShiftLogs[];

  // comment: "จำนวนครั้งที่รับชำระ"
  transactionCount: number;
  // comment: "จำนวนเงินที่รับชำระทั้งหมด"
  transactionAmount: number;

    // comment: "จำนวนครั้งที่ยกเลิกรับชำระ"
    transactionCancelCount: number;
    // comment: "จำนวนเงินที่ยกเลิกรับชำระทั้งหมด"
    transactionCancelAmount: number;

  // comment: "จำนวนครั้งที่รับชำระด้่วยเงินสด"
  transactionCashCount: number;
  // comment: "จำนวนเงินที่รับชำระด้วยเงินสด"
  transactionCashAmount: number;

    // comment: "จำนวนครั้งที่รับชำระด้่วยเงินโอน"
    transactionTransferCount: number;
    // comment: "จำนวนเงินที่รับชำระด้วยเงินโอน"
    transactionTransferAmount: number;

  // comment: "จำนวนครั้งที่รับชำระด้่วยเงินสด"
  transactionMoneyOrderCount: number;
  // comment: "จำนวนเงินที่รับชำระด้วยเงินสด"
  transactionMoneyOrderAmount: number;

  // comment: "จำนวนครั้งที่รับชำระด้่วยเงินสด"
  transactionCheckCount: number;
  // comment: "จำนวนเงินที่รับชำระด้วยเงินสด"
  transactionCheckAmount: number;

  // comment: "ยอดเงินที่นำออกระหว่างรอบ"
  dropAmount: number;

  // comment: "ยอดเงินที่นำเข้าระหว่างรอบ"
  addAmount: number;

  // comment: "เงินเกินหรือขาด (+/-)"
  overShortAmount: number;

  //
  isOnline: boolean;

  isSameUser(userId: number) {
    if (userId !== this.currentCashierId) {
      return false;
    }

    return true;
  }
}
