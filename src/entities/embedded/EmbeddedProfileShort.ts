import moment = require("moment");
import { Column, OneToMany, Index } from "typeorm";
import { AttachedFile } from "../AttachedFile";

export class EmbeddedProfileShort {
  @Index()
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

  @Column({ default: false, comment: "เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่" })
  idCardLifetime: boolean;

  @Column({ default: 0, comment: "อายุ" })
  age: number;

  attachedFiles: AttachedFile[];

  fullName: string | undefined;

  setAge(documentDate: Date | string) {
    if (documentDate && this.birthDate) {
      const rqDate = moment(documentDate);
      const birthDate = moment(this.birthDate);
      this.age = rqDate.diff(birthDate, "years");
    }
  }

  getFullname() {
    const title = this.title ? this.title : "";
    const firstname = this.firstname ? this.firstname : "";
    const lastname = this.lastname ? this.lastname : "";
    return `${title}${firstname} ${lastname}`;
  }
}
