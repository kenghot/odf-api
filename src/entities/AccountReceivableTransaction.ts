import { Column, Entity, Index, ManyToOne } from "typeorm";
import {
  arTransactionStatusSet,
  paymentMethodSet,
  paymentTypeSet
} from "../enumset";
import { AccountReceivable } from "./AccountReceivable";
import { BaseEntity } from "./inherited/BaseEntity";

@Entity("account_receivable_transactions")
@Index(["paymentType", "status", "paymentReferenceNo"])
export class AccountReceivableTransaction extends BaseEntity {
  @Column({ nullable: false, comment: "บัญชีลูกหนี้" })
  accountReceivableId: number;
  @ManyToOne(
    () => {
      return AccountReceivable;
    },
    (ar) => ar.transactions,
    {
      onDelete: "CASCADE"
    }
  )
  accountReceivable: AccountReceivable;

  // ประเภทการชำระเงิน
  // office: "OFFICE",
  // ktb: "KTB",
  // counterService: "CS"
  @Column({
    comment: `ประเภทการชำระเงิน office: "OFFICE",ktb: "KTB",counterService: "CS"`
  })
  paymentType: paymentTypeSet;

  @Column({
    type: "bigint",
    nullable: true,
    comment: `รหัสการชำระเงิน อ้างอิงตาม reference type เช่น ถ้า reference Type เป็น KTB ref.id จะตรงกับ id ของตาราง KTB`
  })
  paymentId: number;

  @Column({
    default: paymentMethodSet.cash,
    comment: `รูปแบบการชำระเงิน cash = "CASH", transfer = "TRANSFER",directDebit = "DIRECTDEBIT",billPayment = "BILLPAYMENT", propmtpay="PROMTPAY"`
  })
  paymentMethod: paymentMethodSet;

  @Column({
    nullable: true,
    comment:
      "รหัสอ้างอิงการชำระเงินต้นทาง เช่น ถ้าชำระเงินผาน KTB ก็จะเป็น รหัสอ้างอิงของ KTB"
  })
  paymentReferenceNo: string;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่ชำระ - วันที่ระบบต้นทางแจ้งว่าเป็นวันชำระเงิน"
  })
  paidDate: Date | string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "จำนวนเงินที่ชำระ"
  })
  paidAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดคงเหลือ (หนี้คงค้าง ณ วันที่เกิด transaction)"
  })
  outstandingDebtBalance: number;

  @Column({
    default: arTransactionStatusSet.normal,
    comment: "สถานนะ transaction"
  })
  status: arTransactionStatusSet;
}
