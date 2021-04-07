import { Column, Entity, ManyToOne } from "typeorm";
import { recieptPrintTypeSet } from "../enumset";
import { BaseEntity } from "./inherited/BaseEntity";
import { Receipt } from "./Receipt";

@Entity("receipt_print_logs")
export class ReceiptPrintLog extends BaseEntity {
  // ใบเสร็จ
  @Column({ nullable: false, comment: "รหัสใบเสร็จ" })
  receiptId: number;
  @ManyToOne(
    () => {
      return Receipt;
    },
    (receipt) => receipt.receiptPrintLogs,
    {
      onDelete: "CASCADE"
    }
  )
  receipt: Receipt;

  // จุดรับชำระที่สั่งปริ้น
  @Column({ nullable: false, comment: "รหัสจุดรับชำระ" })
  POSId: number;

  @Column({
    default: recieptPrintTypeSet.initPrint,
    comment: `รูปแบบการปริ้นใบเสร็จ IP: InitPrint (พิมพ์ต้นฉบับ), RP:Reprint (พิมพ์ซ้ำ), CL:Cancel (ปริ้นยกเลิก)`
  })
  recieptPrintType: recieptPrintTypeSet;
  // ผู้ดูแลการรับชำระ
  @Column({ nullable: true, comment: "ผู้ดูแลการรับชำระ-รหัสผู้ใช้งาน" })
  manageBy: number;
  @Column({ length: 255, default: "", comment: "ผู้ดูแลการรับชำระ-ชื่อ" })
  manageByName: string;
  @Column({ length: 255, default: "", comment: "ผู้ดูแลการรับชำระ-ตำแหน่ง" })
  manageByPosition: string;

  @Column({ type: "datetime", nullable: true, comment: "วันที่พิมพ์/พิมพ์ซ้ำ" })
  printedDatetime: Date | string;
}
