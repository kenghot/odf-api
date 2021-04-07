import { AfterLoad, Column, Entity, ManyToOne } from "typeorm";
import { receiptControlLogStatusSet } from "../enumset";
import { AttachedFile } from "./AttachedFile";
import { BaseEntity } from "./inherited/BaseEntity";
import { Pos } from "./Pos";
import { User } from "./User";

@Entity("receipt_control_logs")
export class ReceiptControlLog extends BaseEntity {
  @Column({ nullable: false, comment: "จุดรับชำระ" })
  posId: number;
  @ManyToOne(() => Pos)
  pos: Pos;

  // วันที่ในเอกสาร
  @Column({ type: "date", nullable: true, comment: "วันที่ในเอกสาร" })
  documentDate: Date | string;

  @Column({ nullable: true, comment: "ผู้อนุมัติ" })
  onDutymanagerId: number;
  @ManyToOne(() => User)
  onDutymanager: User;

  @Column({ nullable: true, comment: "ผู้ขอเบิก" })
  userId: number;
  @ManyToOne(() => User)
  user: User;

  @Column({ default: "REQUEST" })
  logType: string;
  @Column({
    default: receiptControlLogStatusSet.waiting,
    comment: "สถานะของการควบคุมใบเสร็จ"
  })
  status: receiptControlLogStatusSet;
  @Column({ default: 0, comment: "จำนวนที่ร้องขอ" })
  requestQuantity: number;
  @Column({ default: 0, comment: "จำนวนเบิกที่อนุมัติ" })
  approveQuantity: number;
  @Column({ default: "COIL", comment: "หน่วยวัด" })
  unit: string;

  attachedFiles: AttachedFile[]; // refType = "RECEIPT.REQUEST", "RECEIPT.APPROVE"
  requestAttachedFiles: AttachedFile[];
  approveAttachedFiles: AttachedFile[];
}
