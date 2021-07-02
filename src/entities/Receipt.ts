import Big from "big.js";
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
} from "typeorm";
import {
  clientTypeSet,
  officePaymentMethodSet,
  receiptStatusSet,
} from "../enumset";
import { ValidateError } from "../middlewares/error/error-type";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { Pos } from "./Pos";
import { PosShift } from "./PosShift";
import { ReceiptItem } from "./ReceiptItem";
import { ReceiptPrintLog } from "./ReceiptPrintLog";
import { User } from "./User";

const VAT_RATE = 0.07;

@Entity("receipts")
export class Receipt extends BaseEntity {
  @Column({ nullable: false, comment: "หน่วยงานที่ออกใบเสร็จ" })
  organizationId: number;
  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({ nullable: false, comment: "รหัสจุดรับชำระ" })
  posId: number;
  @ManyToOne(() => Pos, { onDelete: "CASCADE" })
  pos: Pos;

  @Column({ nullable: false, comment: "รหัสรอบการทำงาน ณ จุดรับชำระ" })
  posShiftId: number;
  @ManyToOne(() => PosShift)
  posShift: PosShift;

  @Column({ default: "", comment: "รหัสอ้างอิงสำหรับออกรายงานแบบ force" })
  refReportCode: string;

  @Column({ default: "", comment: "ปีงบประมาณ" })
  fiscalYear: string;
  // วันที่ในเอกสาร
  @Column({ type: "date", nullable: true, comment: "วันที่ในเอกสาร" })
  documentDate: Date | string;

  // เลขที่เอกสาร
  @Column({ length: 48, unique: true, comment: "เลขที่เอกสาร" })
  documentNumber: string;

  // ชื่อหน่วยงานบนใบเสร็จ
  @Column({ length: 255, default: "", comment: "ชื่อหน่วยงานบนใบเสร็จ" })
  organizationName: string;

  // ที่อยู่หน่วยงานบนใบเสร็จ1
  @Column({
    length: 256,
    default: "",
    comment: "ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่1",
  })
  organizationAddressLine1: string;
  // ที่อยู่หน่วยงานบนใบเสร็จ2
  @Column({
    length: 256,
    default: "",
    comment: "ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่2",
  })
  organizationAddressLine2: string;
  // ที่อยู่หน่วยงานบนใบเสร็จ3
  @Column({
    length: 256,
    default: "",
    comment: "ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่3",
  })
  organizationAddressLine3: string;
  // ที่อยู่หน่วยงานบนใบเสร็จ4
  @Column({
    length: 256,
    default: "",
    comment: "ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่4",
  })
  organizationAddressLine4: string;

  // หมายเลขผู้เสียภาษีของหน่วยงาน
  @Column({
    length: 16,
    default: "",
    comment: "หมายเลขผู้เสียภาษีของหน่วยงาน",
  })
  organizationTaxNo: string;
  // หมายเลขผู้เสียภาษีของหน่วยงาน
  @Column({
    length: 16,
    default: "",
    comment: "หมายเลขสรรพากร",
  })
  POSVATCode: string;

  // ลูกค้า: ประเภท
  @Column({
    length: 3,
    default: "P",
    comment:
      "ลูกค้า:  ประเภท  P: Personal (บุคคลธรรมดา), C: Company (นิติบุคคล)",
  })
  clientType: clientTypeSet;
  // ลูกค้า: หมายเลขผู้เสียภาษี [บุคคลธรรมดาใส่เลขบัตรปชช]
  @Column({
    length: 16,
    default: "",
    comment: "ลูกค้า: หมายเลขผู้เสียภาษี [บุคคลธรรมดาใส่เลขบัตรปชช]",
  })
  clientTaxNumber: string;
  // ลูกค้า:  title
  @Column({ length: 255, default: "", comment: "ลูกค้า:  ชื่อ" })
  clientName: string;
  // ลูกค้า:  title
  @Column({ length: 255, default: "", comment: "ลูกค้า:  ชื่อ" })
  clientTitle: string;
  // ลูกค้า:  firstname
  @Column({ length: 255, default: "", comment: "ลูกค้า:  ชื่อ" })
  clientFirstname: string;
  // ลูกค้า:  lastname
  @Column({ length: 255, default: "", comment: "ลูกค้า:  ชื่อ" })
  clientLastname: string;

  // ลูกค้า: สาขา
  @Column({ length: 128, default: "", comment: "ลูกค้า: สาขา" })
  clientBranch: string;

  // ลูกค้า: หมายเลขโทรศัพท์
  @Column({ length: 32, default: "", comment: "ลูกค้า: หมายเลขโทรศัพท์" })
  clientTelephone: string;

  // ลูกค้า: ที่อยู่
  @Column({ length: 512, default: "", comment: "ลูกค้า: ที่อยู่" })
  clientAddress: string;

  // หมายเลขอ้างอิงภายนอก
  @Column({ length: 48, default: "", comment: "หมายเลขอ้างอิงภายนอก" })
  exteranalRef: string;

  // ถ้ามีใบเสร็จเก่าให้กรอก {bookNo}/{recieveNo}
  @Column({
    length: 48,
    default: "",
    comment: "หมายเลขอ้างอิงภายใน1 : ของผสให้กรอก receipt book number",
  })
  internalRef1: string;
  @Column({
    length: 48,
    default: "",
    comment: "หมายเลขอ้างอิงภายใน2: ของผสให้กรอก receiptNo",
  })
  internalRef2: string;

  // 1 รวม
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "1 รวม",
  })
  subtotal: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "% ส่วนลด (ตัวคูณ ถ้าลด 10% ให้ใส่ 0.1)",
  })
  discountFactor: number;

  // 2 ส่วนลด
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "2 ส่วนลด",
  })
  discount: number;

  @Column({ default: false, comment: "ราคารวมภาษีมูลค่าเพิ่ม" })
  vatIncluded: boolean;
  // 3 ภาษี
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "3 ภาษี",
  })
  vat: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ราคาไม่รวมภาษีมูลค่าเพิ่ม",
  })
  excludeVat: number;

  // หัก ณ ที่จ่าย (ตัวคูณ ถ้าหัก 3% ให้ใส่ 0.03)
  @Column({
    type: "decimal",
    precision: 4,
    scale: 2,
    default: 0.0,
    comment: "หัก ณ ที่จ่าย (ตัวคูณ ถ้าหัก 3% ให้ใส่ 0.03)",
  })
  withHoldingFactor: number;

  // 4 หัก ณ ที่จ่าย (คำนวนแล้ว)
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "4 หัก ณ ที่จ่าย (คำนวนแล้ว)",
  })
  withHoldingTax: number;

  // รวมทั้งหมด  = 1-2+3-4
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "รวมทั้งหมด  = 1 ลบ 2 บวก 3 ลบ 4",
  })
  total: number;

  // หมายเหตุ
  @Column({ length: 255, default: "", comment: "หมายเหตุ" })
  documentNote: string;

  // หมายเหตุภายใน
  @Column({ length: 256, default: "", comment: "หมายเหตุภายใน" })
  internalNote: string;

  // ผู้อัพเดตข้อมูลล่าสุด
  @Column({ nullable: true, comment: "ผู้อัพเดตข้อมูลล่าสุด-รหัสผู้ใช้งาน" })
  updatedBy: number;
  @Column({ length: 255, default: "", comment: "ผู้อัพเดตข้อมูลล่าสุด-ชื่อ" })
  updatedByName: string;

  // ผู้รับเงิน
  @Column({ nullable: true, comment: "ผู้ดูแลการรับชำระ-รหัสผู้ใช้งาน" })
  recieveBy: number;
  @Column({ length: 255, default: "", comment: "ผู้ดูแลการรับชำระ-ชื่อ" })
  recieveByName: string;
  @Column({ length: 255, default: "", comment: "ผู้ดูแลการรับชำระ-ตำแหน่ง" })
  recieveByPosition: string;

  @Column({ nullable: true, comment: "ผู้อนุมัติการยกเลิก" })
  cancelApprovedManagerId: number;
  @ManyToOne(() => User)
  cancelApprovedManager: User;
  @Column({ nullable: true, comment: "เจ้าหน้าที่ประจำจุดรับชำระ - ชื่อ" })
  cancelApprovedManagerName: string;
  @Column({ nullable: true, comment: "เจ้าหน้าที่ประจำจุดรับชำระ - ตำแหน่ง" })
  cancelApprovedManagerPosition: string;

  @Column({
    default: officePaymentMethodSet.cash,
    comment: `รูปแบบการชำระเงิน cash = "CASH" เงินสด, moneyOrder = "MONEYORDER" ธนาณัติ, check = "CHECK" เช็ค, transfer = "TRANSFER"`,
  })
  paymentMethod: officePaymentMethodSet;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินที่จ่าย",
  })
  paidAmount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "เงินทอน",
  })
  changeAmount: number;

  @Column({ length: 128, nullable: true, comment: "ชื่อธนาคารที่ชำระเงิน" })
  paymentBank: string;

  @Column({ length: 128, nullable: true, comment: "ชื่อสาขาธนาคาร" })
  paymentBankBranch: string;

  @Column({ length: 128, nullable: true, comment: "รหัสอ้างอิงการชำระ" })
  paymentRefNo: string;

  @Column({ type: "datetime", nullable: true, comment: "วันที่ชำระ" })
  paidDate: Date | string;

  // // จำนวนครั้งที่พิมพ์ใบเสร็จ
  // @Column({ default: 0, comment: "จำนวนครั้งที่พิมพ์ใบเสร็จ" })
  printCount: number;

  @OneToMany(() => ReceiptItem, (item) => item.receipt, {
    cascade: ["insert", "update"],
  })
  receiptItems: ReceiptItem[];
  @OneToMany(() => ReceiptPrintLog, (log) => log.receipt, {
    cascade: ["insert", "update"],
  })
  receiptPrintLogs: ReceiptPrintLog[];

  // สถานะใบเสร็จ
  @Column({
    default: receiptStatusSet.paid,
    comment: `สถานะคำร้อง paid = "PD" ชำระแล้ว, cancel = "CL" ยกเลิก, `,
  })
  status: receiptStatusSet;

  calculateSubtotal() {
    let subtotal = 0;
    if (this.receiptItems && this.receiptItems.length > 0) {
      this.receiptItems.forEach((item) => {
        subtotal = subtotal + item.calculateSubtotal();
      });
    }
    return subtotal;
  }

  calculateTotal() {
    const subtotal = this.calculateSubtotal();
    const discount = parseFloat(
      Big(subtotal)
        .times(this.discountFactor ? this.discountFactor : 0)
        .toFixed(2)
    );
    const totalBeforeVat = subtotal - discount;
    const vat = this.vat
      ? parseFloat(Big(totalBeforeVat).times(VAT_RATE).toFixed(2))
      : 0;
    const withHoldingTax = this.withHoldingTax
      ? parseFloat(Big(totalBeforeVat).times(this.withHoldingFactor).toFixed(2))
      : 0;
    const total = totalBeforeVat + vat - withHoldingTax;
    return total;
  }

  validateBeforeInsert() {
    const total = this.calculateTotal();
    if (total != this.total) {
      throw new ValidateError({
        message: `ไม่สามารถบันทึกข้อมูลได้เนื่องจากการคำนวณยอดรวมไม่ถูกต้อง (${
          total - this.total
        })`,
      });
    }
  }

  @AfterLoad()
  doSomethingAfterLoad() {
    if (this.receiptPrintLogs && this.receiptPrintLogs.length > 0) {
      this.printCount = this.receiptPrintLogs.length;
    }
  }

  @BeforeInsert()
  doSomethingBeforeInsert() {
    this.validateBeforeInsert();
  }

  @BeforeUpdate()
  doSomethingBeforeUpdate() {
    // this.validateBeforeInsert();
  }
}
