import moment = require("moment");
import { Column, Entity, ManyToOne } from "typeorm";
import { addressTypeSet } from "../enumset";
import { ValidateError } from "../middlewares/error/error-type";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { EmbeddedOccupation } from "./embedded/EmbeddedOccupation";
import { EmbeddedProfileShort } from "./embedded/EmbeddedProfileShort";
import { Guarantee } from "./Guarantee";
import { BaseEntity } from "./inherited/BaseEntity";

@Entity("guarantee_items")
export class GuaranteeItem extends BaseEntity {
  // สัญญาค้ำประกัน
  @Column({ nullable: true, comment: "รหัสสัญญาค้ำประกัน" })
  guaranteeId: number;
  @ManyToOne(
    () => Guarantee,
    (guarantee) => guarantee.guaranteeItems,
    {
      onDelete: "CASCADE"
    }
  )
  guarantee: Guarantee;

  // ข้อมูลผู้ค้ำ
  @Column(() => EmbeddedProfileShort)
  guarantor: EmbeddedProfileShort;

  // ที่อยู่ตามบัตรประชาชน
  @Column(() => EmbeddedAddress)
  guarantorIdCardAddress: EmbeddedAddress;

  @Column({
    default: addressTypeSet.asIdCard,
    comment: `รูปแบบที่อยู่ตามทะเบียนบ้าน  ข้อมูลที่อยู่ตามทะเบียนบ้าน จะมีค่าเมื่อ registeredAddressType = 2 asIdCard = 0, asRegistered = 1, other = 99,`
  })
  guarantorRegisteredAddressType: addressTypeSet;

  @Column(() => EmbeddedAddress)
  guarantorRegisteredAddress: EmbeddedAddress;

  @Column({ length: 64, default: "", comment: "หมายเลขโทรศัพท์ผู้ค้ำ" })
  guarantorTelephone: string;

  @Column(() => EmbeddedOccupation)
  guarantorOccupation: EmbeddedOccupation;

  @Column({ length: 255, default: "", comment: "ชื่อบริษัทผู้ค้ำ" })
  guarantorCompanyName: string;

  @Column({ length: 128, default: "", comment: "ตำแหน่งงานผู้ค้ำ" })
  guarantorPosition: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "เงินเดือนผู้ค้ำ"
  })
  guarantorSalary: number;

  // ข้อมูลผู้กู้
  @Column(() => EmbeddedProfileShort)
  borrower: EmbeddedProfileShort;

  // setAge(guaranteeDate: Date | string) {
  //   if (!this.guarantor || !this.guarantor.birthDate) {
  //     throw new ValidateError({
  //       name: "ไม่พบวันเกิดของผู้ค้ำประกัน",
  //       message: "ไม่พบวันเกิดของผู้ค้ำประกัน"
  //     });
  //   }

  //   const gDate = moment(guaranteeDate);
  //   const guarantorDate = moment(this.guarantor.birthDate);
  //   this.guarantor.age = gDate.diff(guarantorDate, "years");
  //   this.borrower.age = 0;
  // }
  getBorrowerFullname() {
    return this.borrower ? this.borrower.getFullname() : "";
  }
  getGuarantorFullname() {
    return this.guarantor ? this.guarantor.getFullname() : "";
  }
}
