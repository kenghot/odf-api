import { AfterLoad, Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { PosShift } from "./PosShift";
import { ReceiptSequence } from "./ReceiptSequence";
import { User } from "./User";

@Entity("poses")
export class Pos extends BaseEntity {
  @Column({ nullable: false, comment: "หน่วยงานที่ออกใบเสร็จ" })
  organizationId: number;
  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({
    length: 8,
    default: "",
    comment: "รหัสจุดรับชำระ"
  })
  posCode: string;
  @Column({
    length: 8,
    default: "",
    comment: "ชื่อจุดรับชำระ"
  })
  posName: string;

  @Column({ default: false, comment: "สถานะเปิด/ปิดการใช้งาน VAT" })
  registedVAT: boolean;

  @Column({ default: false, comment: "รหัสอ้างอิงสรรพากร" })
  registedVATCode: string;

  @Column({
    nullable: true,
    comment: "ผู้ดูแลการรับชำระ / ผู้รับเงิน by default"
  })
  managerId: number;
  @ManyToOne(() => User)
  manager: User;

  @Column({ nullable: true, comment: "เลขที่ที่ใช้ในการใบเสร็จรับเงิน" })
  receiptSequenceId: number;
  @ManyToOne(() => ReceiptSequence, { cascade: ["update"] })
  receiptSequence: ReceiptSequence;

  @Column({ default: false, comment: "สถานะเปิด/ปิดการใช้งาน" })
  active: boolean;

  @OneToMany(
    () => PosShift,
    (shift) => shift.pos,
    {
      cascade: ["insert", "update", "remove"]
    }
  )
  shifts: PosShift[];

  @Column({ default: 0, comment: "จำนวนใบเสร็จคงเหลือ" })
  onhandReceipt: number;

  @Column({ nullable: true, comment: "ip ของ printer ที่ต่อกับ Pos" })
  printerIP: string;
  @Column({ nullable: true, comment: "port ของ printer ที่ต่อกับ Pos" })
  printerPort: string;

  // สถานะเปิด/ปิดการรับชำระของจุดรับชำระนี้ ดูว่ามี shift ที่ยังไม่มี endedShift
  isOnline: boolean;

  // shift การทำงานล่าสุดของ pos
  lastestPosShift: PosShift;

  // จำนวนใบเสร็จที่รอการอนุมัติ
  requestReceipt: number;

  @AfterLoad()
  doSomethingAfterLoad() {
    if (this.shifts && this.shifts.length > 0) {
      this.lastestPosShift = this.shifts[0];
      this.isOnline = !this.lastestPosShift.endedShift ? true : false;
    } else if (this.lastestPosShift) {
      this.isOnline = !this.lastestPosShift.endedShift ? true : false;
    }
  }
}
