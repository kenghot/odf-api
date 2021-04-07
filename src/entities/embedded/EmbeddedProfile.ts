import moment = require("moment");
import { Column } from "typeorm";
import {
  addressTypeSet,
  marriageStatusSet,
  residenceStatusTypeSet,
  residenceTypeSet
} from "../../enumset";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import {
  fullNameFormatting,
  idcardFormatting
} from "../../utils/format-helper";
import { getEnumSetText } from "../../utils/get-enum-set-text";
import { AttachedFile } from "../AttachedFile";
import { EmbeddedAddress } from "./EmbeddedAddress";
import { EmbeddedOccupation } from "./EmbeddedOccupation";

export interface IResidence {
  id: number;
  label: string;
  note: string;
  note_suffix: string;
}

export class EmbeddedProfile {
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
    comment: "วันเกิด >> หากไม่ทราบวันเกิดจะระบุเป็นวันที่  1/1/YYYY"
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

  @Column({
    comment: `สถานะภาพสมรส single = 0, married = 1, unregisted = 2, divorce = 3, widow = 4,`
  })
  marriageStatus: marriageStatusSet;

  @Column({ length: 64, default: "", comment: "หมายเลขโทรศัพท์" })
  telephone: string;

  @Column({ length: 64, default: "", comment: "หมายเลขโทรศัพท์มือถือ" })
  mobilePhone: string;

  // ที่อยู่ตามบัตรประชาชน
  @Column(() => EmbeddedAddress)
  idCardAddress: EmbeddedAddress;

  @Column({
    comment: `รูปแบบที่อยู่ตามทะเบียนบ้าน  ข้อมูลที่อยู่ตามทะเบียนบ้าน จะมีค่าเมื่อ registeredAddressType = 2 asIdCard = 0, asRegistered = 1, other = 99,`
  })
  registeredAddressType: addressTypeSet;
  // ที่อยู่ตามทะเบียนบ้าน จะมีค่าเมื่อ registeredAddressType = 2
  @Column(() => EmbeddedAddress)
  registeredAddress: EmbeddedAddress;

  // ที่อยู่ปัจจุบัน ประเภท
  @Column({
    comment: `รูปแบบที่อยู่ปัจจุบัน  ข้อมูลที่อยู่ปัจจุบัน จะมีค่าเมื่อ currentAddressType = 2 asIdCard = 0, asRegistered = 1, other = 99,`
  })
  currentAddressType: addressTypeSet;
  // ที่อยู่ปัจจุบัน จะมีค่าเมื่อ currentAddressType = 2
  @Column(() => EmbeddedAddress)
  currentAddress: EmbeddedAddress;

  // ประเภทที่อยู่อาศัย

  @Column({
    comment: `ประเภทที่อยู่อาศัย house = 0, townhouse = 1, condo = 2, apartment = 3, other = 99`
  })
  residenceType: residenceTypeSet;

  // ประเภทที่อยู่อาศัย อื่นๆ คำอธิบาย
  @Column({
    length: 128,
    default: "",
    comment: `ประเภทที่อยู่อาศัย อื่นๆ คำอธิบาย`
  })
  residenceTypeDescription: string;

  // สถานะการอยู่อาศัย
  @Column({
    comment: `สถานะการอยู่อาศัย rent = 0, installment = 1, owner = 2, relyOnOther = 3, relyOnRelative = 4, relyOnWelfare = 5, other = 99,`
  })
  residenceStatusType: residenceStatusTypeSet;

  @Column({ length: 128, default: "", comment: "สถานะการอยู่อาศัย คำอธิบาย" })
  residenceStatusTypeDescription: string;

  @Column({ comment: "สถานะการประกอบอาชีพ  ทำงาน/ไม่ทำงาน" })
  isWorking: boolean;
  @Column(() => EmbeddedOccupation)
  occupation: EmbeddedOccupation;

  @Column({ comment: "อายุ" })
  age: number;

  attachedFiles: AttachedFile[];

  setAge(documentDate: Date | string) {
    if (documentDate && this.birthDate) {
      const rqDate = moment(documentDate);
      const birthDate = moment(this.birthDate);
      this.age = rqDate.diff(birthDate, "years");
    }
  }
  
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
    this.marriageStatus = getEnumSetText("marriageStatus", this.marriageStatus);
  }

  getFullname() {
    const title = this.title ? this.title : "";
    const firstname = this.firstname ? this.firstname : "";
    const lastname = this.lastname ? this.lastname : "";
    return `${title}${firstname} ${lastname}`;
  }
}
