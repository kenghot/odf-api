import { Column, Entity, Index, ManyToOne } from "typeorm";

import { phoneNumberFormatting } from "../utils/format-helper";
import { AgreementSequence } from "./AgreementSequence";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { GuaranteeSequence } from "./GuaranteeSequence";
import { BaseEntity } from "./inherited/BaseEntity";
import { RequestSequence } from "./RequestSequence";
import { RequestOnlineSequence } from "./RequestOnlineSequence";
import { VoucherSequence } from "./VoucherSequence";
import { bankSet } from "../enumset";

@Entity("organizations")
export class Organization extends BaseEntity {
  @Column({ length: 255, default: "", comment: "ชื่อหน่วยงาน" })
  orgName: string;

  @Column({
    length: 8,
    default: "",
    comment: "รหัสหน่วยงาน",
  })
  @Index()
  orgCode: string;

  @Column({
    length: 8,
    default: "",
    comment:
      "รหัสอ้างอิงสำหรับออกรายงาน นี้จะใช้เป็น default ในการ stamp ค่า refReportCode ตามเอกสารต่างๆ ",
  })
  refReportCode: string;

  @Column(() => EmbeddedAddress)
  address: EmbeddedAddress;

  @Column({
    length: 128,
    default: "",
    comment: "ผู้มีสิทธิ์ลงนาม คำนำหน้าชื่อ",
  })
  agreementAuthorizedTitle: string;

  @Column({ length: 128, default: "", comment: "ผู้มีสิทธิ์ลงนาม ชื่อ" })
  agreementAuthorizedFirstname: string;

  @Column({ length: 128, default: "", comment: "ผู้มีสิทธิ์ลงนาม นามสกุล" })
  agreementAuthorizedLastname: string;

  @Column({ length: 128, default: "", comment: "ผู้มีสิทธิ์ลงนาม ตำแหน่ง" })
  agreementAuthorizedPosition: string;

  @Column({
    length: 128,
    default: "",
    comment: "ผู้มีสิทธิ์ลงนามจากคำสั่งเลขที่",
  })
  agreementAuthorizedCommandNo: string;

  @Column({
    type: "date",
    nullable: true,
    comment: "ผู้มีสิทธิ์ลงนามจากคำสั่งเมื่อวันที่",
  })
  agreementAuthorizedCommandDate: Date | string;

  @Column({ length: 255, default: "", comment: "พยานคนที่1" })
  witness1: string;

  @Column({ length: 255, default: "", comment: "พยานคนที่2" })
  witness2: string;

  @Column({ default: false, comment: "สถานะเปิด/ปิดการใช้งาน" })
  active: boolean;

  @Column({ length: 64, default: "", comment: "หมายเลขโทรศัพท์" })
  telephone: string;

  @Column({ length: 64, default: "", comment: "หมายเลขผู้เสียภาษีของหน่วยงาน" })
  taxNumber: string;

  @ManyToOne(() => RequestSequence, { cascade: ["update"] })
  requestSequence: RequestSequence;

  @ManyToOne(() => RequestOnlineSequence, { cascade: ["update"] })
  requestOnlineSequence: RequestOnlineSequence;

  @ManyToOne(() => AgreementSequence, { cascade: ["update"] })
  agreementSequence: AgreementSequence;

  @ManyToOne(() => GuaranteeSequence, { cascade: ["update"] })
  guaranteeSequence: GuaranteeSequence;

  @ManyToOne(() => VoucherSequence, { cascade: ["update"] })
  voucherSequence: VoucherSequence;

  @ManyToOne(() => Organization)
  parent: Organization;

  @Column({ length: 64, default: "", comment: "ภาค" })
  region: string;

  @Column({
    length: 16,
    default: "",
    comment: `ชื่อธนาคาร เป็น list ให้เลือก KTB = "KTB"`,
  })
  bankName: bankSet;
  @Column({ length: 8, default: "", comment: "รหัสสาขา" })
  bankBranchCode: string;
  @Column({ length: 255, default: "", comment: "ชื่อบัญชีธนาคาร" })
  bankAccountName: string;
  @Column({ length: 16, default: "", comment: "เลขทีบัญชีธนาคาร" })
  bankAccountNo: string;

  @Column({
    type: "simple-json",
    nullable: true,
  })
  specialPOS: string;

  @Column({
    length: 128,
    default: "",
    comment: "ผู้มีสิทธิ์ลงนามขอบคุณเงินบริจาค คำนำหน้าชื่อ",
  })
  donationAuthorizedTitle: string;

  @Column({
    length: 128,
    default: "",
    comment: "ผู้มีสิทธิ์ลงนามขอบคุณเงินบริจาค ชื่อ",
  })
  donationAuthorizedFirstname: string;

  @Column({
    length: 128,
    default: "",
    comment: "ผู้มีสิทธิ์ลงนามขอบคุณเงินบริจาค นามสกุล",
  })
  donationAuthorizedLastname: string;

  @Column({
    length: 128,
    default: "",
    comment: "ผู้มีสิทธิ์ลงนามขอบคุณเงินบริจาค ตำแหน่ง",
  })
  donationAuthorizedPosition: string;

  setThaiFormatForReport() {
    this.telephone = phoneNumberFormatting(this.telephone);
  }
}
