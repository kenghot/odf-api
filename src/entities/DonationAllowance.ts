import { AfterLoad, Column, Entity, ManyToOne } from "typeorm";
import { EmbeddedProfileShort2 } from "./embedded/EmbeddedProfileShort2";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { Pos } from "./Pos";
import { Receipt } from "./Receipt";

@Entity("donation_allowances")
export class DonationAllowance extends BaseEntity {
  @Column({ nullable: false, comment: "หน่วยงานที่รับเงินบริจาค" })
  organizationId: number;
  @ManyToOne(() => Organization, { nullable: false })
  organization: Organization;
  @Column({ length: 128, default: "", comment: "หน่วยงานที่รับเรื่อง" })
  receiptOrganization: string;
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
  @Column({ nullable: true, comment: "รหัสจุดรับชำระ" })
  posId: number;
  @ManyToOne(() => Pos, { onDelete: "CASCADE" })
  pos: Pos;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "จำนวนเงินที่ชำระ",
  })
  paidAmount: number;
  @Column(() => EmbeddedProfileShort2)
  donator: EmbeddedProfileShort2;

  @Column({ type: "text", nullable: true, comment: "หมายเหตุ" })
  note: string;

  @AfterLoad()
  doSomethingAfterLoad() {
    if (this.donationDate === "0000-00-00") this.donationDate = null;
    if (this.receiptDate === "0000-00-00") this.receiptDate = null;
    this.donator.setFullname();
  }
}
