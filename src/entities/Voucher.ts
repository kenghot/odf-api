import { Column, Entity, ManyToOne, OneToMany, BeforeUpdate } from "typeorm";
import {
  bankSet,
  paymentMethodSet,
  voucherStatusSet,
  voucherTypeSet,
} from "../enumset";
import { getThaiPartialDate } from "../utils/datetime-helper";
import { convertFullMoney } from "../utils/money-to-thai-text";
import { Agreement } from "./Agreement";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { VoucherItem } from "./VoucherItem";
import { calMainChar, idcardFormatting } from "../utils/format-helper";
import { IsEmail } from "class-validator";
import { getEnumSetText } from "../utils/get-enum-set-text";

const bankCode = {
  [`${bankSet.KTB}`]: "006",
};

@Entity("vouchers")
export class Voucher extends BaseEntity {
  @Column({ nullable: false, comment: "หน่วยงานที่สร้างเอกสาร" })
  organizationId: number;
  @ManyToOne(() => Organization)
  organization: Organization;

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

  // ประเภทใบสำคัญ : ใบสำคัญจ่าย / ใบสำคัญรับ
  @Column({
    default: voucherTypeSet.payment,
    comment: `ประเภทใบสำคัญ : ใบสำคัญจ่าย / ใบสำคัญรับ PHASE 1 รองรับแค่ payment payment = "PAYMENT", receive = "RECEIVE",`,
  })
  voucherType: voucherTypeSet;

  // สถานะใบสำคัญ
  @Column({
    default: voucherStatusSet.waiting,
    comment: `สถานะใบสำคัญ  waiting = "WT", paid = "PD",`,
  })
  status: voucherStatusSet;

  // เอกสารอ้างอิงการจ่าย
  // phase 1 รองรับ  referencType: Agreement / referenceId: agreementId
  @Column({
    length: 16,
    comment:
      "เอกสารอ้างอิงการจ่าย // phase 1 รองรับแค่  referencType: Agreement ",
  })
  refType: string;
  @Column({
    type: "bigint",
    comment: "เอกสารอ้างอิงการจ่าย ใช้คู่กับ refType ",
  })
  refId: number;

  refDocument: Agreement;

  // หมายเลขอ้างอิงภายนอก
  @Column({ length: 48, default: "", comment: "หมายเลขอ้างอิงภายนอก" })
  exteranalRef: string;

  // จ่ายให้
  @Column({
    length: 255,
    default: "",
    comment:
      "ชื่อผู้รับเงิน / ผู้จ่ายเงิน ดูจากประเภทใบสำคัญ ถ้าเป็นใบสำคัญจ่ายจะหมายถึงผู้รับเงิน",
  })
  partnerName: string;

  // ที่อยู่
  @Column({
    length: 512,
    default: "",
    comment: "ที่อยู่ ผู้รับเงิน / ผู้จ่ายเงิน ",
  })
  partnerAddress: string;

  // เลขประจำตัวผู้เสียภาษี [บุคคลธรรมดาใส่เลขบัตรปชช]
  @Column({
    length: 16,
    default: "",
    comment:
      "เลขประจำตัวผู้เสียภาษี ผู้รับเงิน / ผู้จ่ายเงิน [บุคคลธรรมดาใส่เลขบัตรปชช]",
  })
  partnerTaxNumber: string;

  // ยอดรวม
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินที่รับ หรือ จ่าย",
  })
  totalAmount: number;

  // ยอดรวมตัวอักษร
  totalAmountText: string | undefined;

  // รูปแบบการชำระเงิน fix โอนเงิน สำหรับงานกองทุนผส
  @Column({
    default: paymentMethodSet.transfer,
    comment: `รูปแบบการชำระเงิน >> Phase 1 รอบรับการทำใบสำคัญจ่ายแบบโอนเงินเท่านั้น cash = "CASH", transfer = "TRANSFER", directDebit = "DIRECT DEBIT", billPayment = "BILL PAYMENT",`,
  })
  paymentMethod: paymentMethodSet;

  // เลขอ้างอิงการชำระ
  // โอนเงิน:  1: ชื่อธนาคาร 2: เลขที่บัญชี 3: รหัสสาขา
  // เช็ค:  1: ชื่อธนาคาร 2: เลขที่เช็ค 3: เช็คลงวันที่
  @Column({
    length: 16,
    default: "",
    comment: `เลขอ้างอิงการชำระ ตัวอย่างการใช้เลขอ้างอิงการชำระ ขึ้นอยู่กับ paymentMethod  TRANSFER โอนเงิน:  Ref1: ชื่อธนาคาร Ref2: เลขที่บัญชี Ref3: วันที่จะโอน BILL PAYMENT เช็ค:  Ref1: ชื่อธนาคาร Ref2: เลขที่เช็ค Ref3: เช็คลงวันที่`,
  })
  fromAccountRef1: string;
  @Column({
    length: 16,
    default: "",
    comment: `เลขอ้างอิงการชำระ ดูวิธิการใช้ที่ fromAccountRef1`,
  })
  fromAccountRef2: string;
  @Column({
    length: 16,
    default: "",
    comment: `เลขอ้างอิงการชำระ ดูวิธิการใช้ที่ fromAccountRef1`,
  })
  fromAccountRef3: string;
  @Column({
    length: 255,
    default: "",
    comment: `เลขอ้างอิงการชำระ ดูวิธิการใช้ที่ fromAccountRef1`,
  })
  fromAccountRef4: string; // ชื่อบัญชีหน่วยงานที่จ่ายเงิน

  // อ้างอิงการรับเงิน
  @Column({
    length: 16,
    default: "",
    comment: `ชื่อธนาคาร เป็น list ให้เลือก KTB = "KTB"`,
  })
  toBankName: bankSet;
  @Column({ length: 16, default: "", comment: "เลขทีบัญชีปลายทาง" })
  toAccountNo: string;
  @Column({ length: 255, default: "", comment: "ชื่อบัญชีปลายทาง" })
  toAccountName: string;
  // หมายเลขบัญชีธนาคารสำหรับรับโอนเงินกู้
  @Column({
    length: 32,
    default: "",
    comment: "หมายเลข18หลักที่ต้องใช้โอนเงินให้KTB",
  })
  recieveBankAccountRefNo: string;

  @Column({ length: 64, default: "", comment: "หมายเลขโทรศัพท์มือถือ" })
  toSms: string;

  @Column({ length: 128, nullable: true, comment: "อีเมล" })
  @IsEmail()
  toEmail: string;
  @Column({ length: 255, default: "", comment: "สาขา" })
  toAccountBranch: string;
  @Column({ length: 255, default: "", comment: "ประเภทบัญชี" })
  toAccountType: string;
  @Column({ length: 16, default: "", comment: "รหัสสาขา" })
  toBranchCode: string;

  // TODO: Attachedfile

  // item
  @OneToMany(() => VoucherItem, (voucherItem) => voucherItem.voucher, {
    cascade: ["insert", "update"],
  })
  voucherItems: VoucherItem[];

  // ยอดที่จ่ายแล้ว
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดที่ชำระแล้ว",
  })
  paidAmount: number;

  // วันที่จ่าย
  @Column({ type: "date", nullable: true, comment: "วันที่ชำระ" })
  paidDate: Date | string;

  // เลขที่อ้างอิงการจ่าย 1
  @Column({ length: 128, default: "", comment: "ลขที่อ้างอิงการจ่าย 1" })
  paidRef1: string;

  // เลขที่อ้างอิงการจ่าย 2
  @Column({ length: 128, default: "", comment: "เลขที่อ้างอิงการจ่าย 2" })
  paidRef2: string;

  // ผู้รับเงิน
  @Column({ length: 255, default: "", comment: "ผู้รับเงิน" })
  reciever: string;

  // ผู้จ่ายเงิน
  @Column({
    nullable: true,
    comment: "รหัสผู้ใช้งานของผู้จ่ายเงิน",
  })
  payBy: number;
  @Column({ length: 255, default: "", comment: "ชื่อผู้จ่ายเงิน" })
  payByName: string;
  @Column({ length: 255, default: "", comment: "ตำแหน่งผู้จ่ายเงิน" })
  payByPosition: string;

  // ผู้อนุมัติ
  @Column({ nullable: true, comment: "รหัสผู้ใช้งานของผู้อนุมัติ" })
  approvedBy: number;
  @Column({ length: 255, default: "", comment: "ชื่อผู้อนุมัติ" })
  approvedByName: string;
  @Column({ length: 255, default: "", comment: "ตำแหน่งผู้อนุมัติ" })
  approvedByPosition: string;

  // วันที่ครบกำหนดชำระ
  @Column({ type: "date", nullable: true, comment: "วันที่ครบกำหนดชำระ" })
  dueDate: Date | string;
  error: { message: string };

  address1: string;
  address2: string;
  addressKTB1: string;
  addressKTB2: string;
  isAddressThirdLine: boolean;
  toBankNameText: string;

  getTotalAmount() {
    let total = 0.0;
    this.voucherItems.forEach((vi) => {
      total += +vi.subtotal;
    });
    return total;
  }

  setTotalAmount() {
    this.totalAmount = this.getTotalAmount();
  }
  setThaiFormatForReport() {
    this.documentDate =
      this.documentDate && getThaiPartialDate(this.documentDate);
    this.totalAmountText = convertFullMoney(Number(this.totalAmount));
    const address = this.getAddress(40);
    this.address1 = address[0];
    this.address2 = address[1];
    this.isAddressThirdLine = this.address2.length > 96 ? true : false;
    const addressKTB = this.getAddress(80);
    this.addressKTB1 = addressKTB[0];
    this.addressKTB2 = addressKTB[1];
    this.partnerTaxNumber = this.partnerTaxNumber
      ? idcardFormatting(this.partnerTaxNumber)
      : this.partnerTaxNumber;
    this.toBankNameText = getEnumSetText("bank", this.toBankName);
  }
  generate18Digit(): [string, string, string] {
    // แปลงค่าเฉพาะ KTB
    const receivingBank =
      this.toBankName === bankSet.KTB
        ? bankCode[this.toBankName]
        : this.toBankName;

    let receivingBranchCode = "";
    let receivingAccount = "";

    receivingBranchCode = this.toBranchCode.padStart(4, "0");

    const length = this.toAccountNo.length;
    const isMoreThan11 = length - 11;

    // กรณีเลขที่บัญชีธนาคารยาวเกิน11หลัก
    if (isMoreThan11 > 0) {
      // receivingBranchCode = this.toAccountNo
      //   .substr(0, isMoreThan11)
      //   .padStart(4, "0");
      receivingAccount = this.toAccountNo
        .substr(isMoreThan11)
        .padStart(11, "0");
    } else {
      // receivingBranchCode = "0000";
      receivingAccount = this.toAccountNo.padStart(11, "0");
    }

    return [receivingBank, receivingBranchCode, receivingAccount];
  }

  getAddress(limit: number) {
    let mainChar = calMainChar(this.partnerAddress);
    // const re = /(อำเภอ|เขต)/;
    const re = /(ตำบล\/แขวง|ตำบล|แขวง)/;
    const match = this.partnerAddress.match(re);
    if (match) {
      const addr1 = this.partnerAddress.substr(0, match.index);
      let mainCharAddr1 = calMainChar(addr1);

      if (mainCharAddr1 > limit) {
        return this.getAddressIfLine1IsOverLimit(limit);
      } else {
        return [addr1, this.partnerAddress.substr(match.index)];
      }
      // กรณีไม่เจอตำบล/แขวง
    } else {
      if (mainChar > limit) {
        return this.getAddressIfLine1IsOverLimit(limit);
      } else {
        return [
          `${this.partnerAddress.substr(0, limit)}` || "",
          this.partnerAddress.substr(limit) || "",
        ];
      }
    }
  }

  getAddressIfLine1IsOverLimit(limit: number) {
    let splitIndex = limit;
    while (
      this.partnerAddress[splitIndex] &&
      this.partnerAddress[splitIndex] !== " "
    ) {
      splitIndex++;
      if (["ะ", "า"].includes(this.partnerAddress[splitIndex])) {
        splitIndex++;
        break;
      }
      if (splitIndex > limit + 5) {
        break;
      }
    }
    if (this.partnerAddress[splitIndex]) {
      return [
        `${this.partnerAddress.substr(0, splitIndex)}` || "",
        this.partnerAddress.substr(splitIndex) || "",
      ];
    } else {
      return [
        `${this.partnerAddress.substr(0, limit)}` || "",
        this.partnerAddress.substr(limit) || "",
      ];
    }
  }
  @BeforeUpdate()
  private async doSomethingBeforeUpdate() {
    const [
      receivingBank,
      receivingBranchCode,
      receivingAccount,
    ] = this.generate18Digit();
    this.recieveBankAccountRefNo = `${receivingBank}${receivingBranchCode}${receivingAccount}`;
  }
}
