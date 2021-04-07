import moment = require("moment");
import { Column } from "typeorm";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import {
  fullNameFormatting,
  idcardFormatting,
} from "../../utils/format-helper";
import { EmbeddedAddress } from "./EmbeddedAddress";

export interface IResidence {
  id: number;
  label: string;
  note: string;
  note_suffix: string;
}

export class EmbeddedProfileShort2 {
  @Column({ length: 13, default: "", comment: "หมายเลขบัตรประชาชน" })
  idCardNo: string;

  @Column({ length: 128, default: "", comment: "คำนำหน้าชื่อ" })
  title: string;

  @Column({ length: 128, default: "", comment: "ชื่อ" })
  firstname: string;

  @Column({ length: 128, default: "", comment: "นามสกุล" })
  lastname: string;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันเกิด >> หากไม่ทราบวันเกิดจะระบุเป็นวันที่  1/1/YYYY",
  })
  birthDate: Date;

  @Column({ default: false, comment: "ไม่ทราบวันเกิด" })
  isOnlyBirthYear: boolean;

  @Column({ length: 128, default: "", comment: "บัตรประชาชน ออกโดย" })
  idCardIssuer: string;

  @Column({ type: "date", nullable: true, comment: "บัตรประชาชน ออกเมื่อ" })
  idCardIssuedDate: Date;

  @Column({ type: "date", nullable: true, comment: "บัตรประชาชน วันหมดอายุ" })
  idCardExpireDate: Date;

  @Column({ comment: "เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่" })
  idCardLifetime: boolean;

  // ที่อยู่ตามบัตรประชาชน
  @Column(() => EmbeddedAddress)
  idCardAddress: EmbeddedAddress;

  @Column(() => EmbeddedAddress)
  documentDeliveryAddress: EmbeddedAddress;

  fullName: string | undefined;

  setThaiFormatForReport() {
    this.fullName = fullNameFormatting(
      this.title,
      this.firstname,
      this.lastname
    );
    this.idCardNo = idcardFormatting(this.idCardNo);
    this.birthDate = getThaiPartialDate(this.birthDate);
    this.idCardExpireDate = getThaiPartialDate(this.idCardExpireDate);
    this.idCardIssuedDate = getThaiPartialDate(this.idCardIssuedDate);
  }
  setFullname() {
    this.fullName = fullNameFormatting(
      this.title,
      this.firstname,
      this.lastname
    );
  }
}
