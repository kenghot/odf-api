import { Column, Entity, ManyToOne } from "typeorm";

import moment = require("moment");
import { addressTypeSet } from "../enumset";
import { ValidateError } from "../middlewares/error/error-type";
import { Agreement } from "./Agreement";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { EmbeddedProfileShort } from "./embedded/EmbeddedProfileShort";
import { BaseEntity } from "./inherited/BaseEntity";

@Entity("agreement_items")
export class AgreementItem extends BaseEntity {
  @Column({ nullable: true, comment: "สัญญา" })
  agreementId: number;
  @ManyToOne(
    () => Agreement,
    (agreement) => agreement.agreementItems,
    {
      onDelete: "CASCADE"
    }
  )
  agreement: Agreement;

  // ข้อมูลผู้กู้
  @Column(() => EmbeddedProfileShort)
  borrower: EmbeddedProfileShort;

  // ที่อยู่ตามบัตรประชาชน
  @Column(() => EmbeddedAddress)
  borrowerIdCardAddress: EmbeddedAddress;

  @Column({
    comment: `รูปแบบที่อยู่ตามทะเบียนบ้าน  ข้อมูลที่อยู่ตามทะเบียนบ้าน จะมีค่าเมื่อ registeredAddressType = 2 asIdCard = 0, asRegistered = 1, other = 99,`
  })
  borrowerRegisteredAddressType: addressTypeSet;

  @Column(() => EmbeddedAddress)
  borrowerRegisteredAddress: EmbeddedAddress;

  @Column({ length: 64, default: "", comment: "หมายเลขโทรศัพท์ผู้กู้" })
  borrowerTelephone: string;

  // ข้อมูลผู้ค้ำ
  @Column(() => EmbeddedProfileShort)
  guarantor: EmbeddedProfileShort;

  // setAge(agreementDate: Date | string) {
  //   if (!this.borrower || !this.borrower.birthDate) {
  //     throw new ValidateError({
  //       name: "ไม่พบวันเกิดของผู้ขอกู้",
  //       message: "ไม่พบวันเกิดของผู้ขอกู้"
  //     });
  //   }

  //   const aDate = moment(agreementDate);
  //   const borrowerDate = moment(this.borrower.birthDate);
  //   this.borrower.age = aDate.diff(borrowerDate, "years");
  //   this.guarantor.age = 0;
  // }
  getBorrowerFullname() {
    return this.borrower ? this.borrower.getFullname() : "";
  }
  getGuarantorFullname() {
    return this.guarantor ? this.guarantor.getFullname() : "";
  }
}
