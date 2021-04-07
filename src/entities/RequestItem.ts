import { Column, Entity, ManyToOne } from "typeorm";

import { guarantorBorrowerRelationshipSet } from "../enumset";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { EmbeddedProfile } from "./embedded/EmbeddedProfile";
import { EmbeddedProfileShort } from "./embedded/EmbeddedProfileShort";
import { BaseEntity } from "./inherited/BaseEntity";
import { Request } from "./Request";

@Entity("request_items")
export class RequestItem extends BaseEntity {
  // คำร้อง
  @Column({ nullable: false, comment: "รหัสคำร้อง" })
  requestId: number;
  @ManyToOne(
    () => Request,
    (request) => request.requestItems,
    {
      onDelete: "CASCADE"
    }
  )
  request: Request;

  // ข้อมูลผู้กู้
  @Column(() => EmbeddedProfile)
  borrower: EmbeddedProfile;

  // ข้อมูลผู้สมรส
  @Column(() => EmbeddedProfileShort)
  spouse: EmbeddedProfileShort;

  // ข้อมูลผู้ค้ำประกัน
  @Column(() => EmbeddedProfile)
  guarantor: EmbeddedProfile;

  // ข้อมูลผู้สมรสของผู้ค้ำประกัน
  guarantorSpouse: EmbeddedProfileShort | any = {};

  // ความสัมพันธ์ผู้กู้ผู้ค้ำ
  @Column({
    comment: `ความสัมพันธ์ผู้กู้ผู้ค้ำ children = 0,relative = 1, friend = 2,`
  })
  guarantorBorrowerRelationship: guarantorBorrowerRelationshipSet;

  // ชื่อบริษัทผู้ค้ำ
  @Column({ length: 128, default: "", comment: "ชื่อบริษัทผู้ค้ำ" })
  guarantorCompanyName: string;

  // ตำแหน่ง
  @Column({ length: 128, default: "", comment: "ตำแหน่งงานผู้ค้ำ" })
  guarantorPosition: string;

  // ที่อยู่บริษัทผู้ค้ำ
  @Column(() => EmbeddedAddress)
  guarantorCompanyAddress: EmbeddedAddress;

  // หมายลขโทรศัพท์บริษัทผู้ค้ำ
  @Column({ length: 64, default: "", comment: "หมายลขโทรศัพท์บริษัทผู้ค้ำ" })
  guarantorCompanyTelephone: string;

  getBorrowerFullname() {
    return this.borrower ? this.borrower.getFullname() : "";
  }
  getGuarantorFullname() {
    return this.guarantor ? this.guarantor.getFullname() : "";
  }
}
