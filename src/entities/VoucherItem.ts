import { Column, Entity, ManyToOne } from "typeorm";
import { BaseEntity } from "./inherited/BaseEntity";
import { Voucher } from "./Voucher";

@Entity("voucher_items")
export class VoucherItem extends BaseEntity {
  // ใบสำคัญ
  @Column({ nullable: false, comment: "รหัสใบสำคัญ" })
  voucherId: number;
  @ManyToOne(() => Voucher, (voucher) => voucher.voucherItems, {
    onDelete: "CASCADE"
  })
  voucher: Voucher;

  @Column({ length: 512, default: "", comment: "รายการ" })
  description: string;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "จำนวนเงิน"
  })
  subtotal: number;
}
