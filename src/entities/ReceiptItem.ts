import { Column, Entity, ManyToOne } from "typeorm";
import { BaseEntity } from "./inherited/BaseEntity";
import { Receipt } from "./Receipt";

@Entity("receipt_items")
export class ReceiptItem extends BaseEntity {
  // ใบเสร็จ
  @Column({ nullable: false, comment: "รหัสใบเสร็จ" })
  receiptId: number;
  @ManyToOne(
    () => {
      return Receipt;
    },
    (receipt) => receipt.receiptItems,
    {
      onDelete: "CASCADE",
    }
  )
  receipt: Receipt;

  // เอกสารอ้างอิงใบเสร็จ
  @Column({
    length: 16,
    comment: `เอกสารอ้างอิงรายการชำระ ใช้คู่กับ referencType: AR: AccountRecievable (ชำระคืนเงินกู้) , D: Donation (บริจาคเงินสมทบกองทุนผู้สูงอายุ),DA: Donation Allowance (บริจาคเบี้ยยังชีพผู้สูงอายุ PR:ProjectRemaining (ชำระคืนเงินเหลือจ่ายจากการดำเนินโครงการ), O:Other (อื่่นๆ)`,
  })
  refType: string;
  @Column({
    nullable: true,
    comment: `เลขที่อ้างอิงในระบบ`,
  })
  refId: string;

  @Column({
    nullable: true,
    comment: `เลขที่อ้างอิง1 ขึ้นอยู่กับประเภท refType`,
  })
  ref1: string;
  @Column({
    nullable: true,
    comment: `เลขที่อ้างอิง2 ขึ้นอยู่กับประเภท refType`,
  })
  ref2: string;
  @Column({
    nullable: true,
    comment: `เลขที่อ้างอิง3 ขึ้นอยู่กับประเภท refType`,
  })
  ref3: string;
  @Column({
    nullable: true,
    comment: `เลขที่อ้างอิง4 ขึ้นอยู่กับประเภท refType`,
  })
  ref4: string;

  // ชื่อรายการ
  @Column({ default: "", comment: "ชื่อรายการ" })
  name: string;

  // คำอธิบาย บรรทัด1
  @Column({ length: 128, default: "", comment: "คำอธิบาย บรรทัด1" })
  description1: string;
  // คำอธิบาย บรรทัด2
  @Column({ length: 128, default: "", comment: "คำอธิบาย บรรทัด2" })
  description2: string;
  // คำอธิบาย บรรทัด3
  @Column({ length: 128, default: "", comment: "คำอธิบาย บรรทัด3" })
  description3: string;
  // คำอธิบาย บรรทัด4
  @Column({ length: 128, default: "", comment: "คำอธิบาย บรรทัด4" })
  description4: string;

  // จำนวน
  @Column({ default: 1, comment: "จำนวน" })
  quantity: number;

  // ราคาต่อหน่วย
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ราคาต่อหน่วย",
  })
  price: number;

  // ยอดรวมรายการ
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดรวมรายการ",
  })
  subtotal: number;

  calculateSubtotal() {
    return this.quantity * this.price;
  }
}
