import { Column, Entity, ManyToOne } from "typeorm";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { Receipt } from "./Receipt";

@Entity("donation_directs")
export class DonationDirect extends BaseEntity {
  @Column({ type: "date", nullable: true, comment: "วันที่ประสงค์บริจาค" })
  donationDate: Date | string;
  @Column({ type: "date", nullable: true, comment: "วันที่บริจาค" })
  receiptDate: Date | string;
  @Column({ nullable: true, comment: "รหัสใบเสร็จ" })
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
  @Column({ default: "", comment: "ชื่อโครงการ" })
  name: string;
  // หน่วยงานที่สร้างคำร้อง
  @Column({ nullable: false, comment: "หน่วยงานที่สร้างคำร้อง" })
  organizationId: number;
  @ManyToOne(() => Organization, { nullable: false })
  organization: Organization;

  @Column({ length: 13, default: "", comment: "หมายเลขบัตรประชาชน" })
  donatorIdCardNo: string;
  @Column({ length: 128, default: "", comment: "คำนำหน้าชื่อ" })
  donatorTitle: string;
  @Column({ length: 128, default: "", comment: "คำนำหน้าชื่อ" })
  donatorFirstname: string;
  @Column({ length: 128, default: "", comment: "คำนำหน้าชื่อ" })
  donatorLastname: string;
  @Column({ type: "text", nullable: true, comment: "ชื่อผู้บริจาค" })
  donatorName: string;
  @Column({ type: "text", nullable: true, comment: "ที่อยู่ผู้บริจาค" })
  donatorAddress: string;
  @Column({ type: "text", nullable: true, comment: "ที่อยู่จัดส่ง" })
  deliveryAddress: string;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "จำนวนเงินที่ชำระ",
  })
  paidAmount: number;

  @Column({ type: "text", nullable: true, comment: "หมายเหตุ" })
  note: string;
}
