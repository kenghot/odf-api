import { Column, Entity, OneToOne } from "typeorm";
import { addressTypeSet, residenceWithSet } from "./../enumset";
import { AttachedFile } from "./AttachedFile";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { EmbeddedProfileShort } from "./embedded/EmbeddedProfileShort";
import { BaseEntity } from "./inherited/BaseEntity";
import { Request } from "./Request";
import { getThaiPartialDate } from "../utils/datetime-helper";

@Entity("request_fact_sheets")
export class RequestFactSheet extends BaseEntity {
  // คำร้อง
  @Column({ nullable: true, comment: "รหัสคำร้อง" })
  requestId: number;
  @OneToOne(
    () => Request,
    (request) => request.factSheet,
    {
      onDelete: "CASCADE"
    }
  )
  request: Request;

  // ข้อมูลผู้กู้
  @Column(() => EmbeddedProfileShort)
  borrower: EmbeddedProfileShort;

  // อาศัยอยู่กับ
  // 0: spouse,  1: child, 2: other,
  @Column({
    comment: `อาศัยอยู่กับ spouse = 0, child = 1, other = 99,`
  })
  residenceWith: residenceWithSet;
  @Column({ default: 0 })
  // คำอธิบายอาศัยอยู่กับ
  @Column({ default: "", comment: "คำอธิบายอาศัยอยู่กับ" })
  residenceWithDescription: string;

  // จำนวนบุตร
  @Column({ default: 0, comment: "จำนวนบุตร" })
  numberOfChildren: number;

  // จำนวนบุตรที่ทำงานแล้ว
  @Column({ default: 0, comment: "จำนวนบุตรที่ทำงานแล้ว" })
  numberOfWorkingChildren: number;

  // จำนวนบุตรในอุปการะ
  @Column({ default: 0, comment: "จำนวนบุตรในอุปการะ" })
  numberOfParentingChildren: number;

  // ที่อยู่ปัจจุบัน ประเภท
  @Column({
    comment: `ที่อยู่ปัจจุบัน ประเภท ที่อยู่ปัจจุบัน จะมีค่าเมื่อ currentAddressType = 2 asIdCard = 0, asRegistered = 1, other = 99`
  })
  currentAddressType: addressTypeSet; // 0: same as id_card, 1: same as current, 2: other

  // ที่อยู่ปัจจุบัน จะมีค่าเมื่อ currentAddressType = 2
  @Column(() => EmbeddedAddress)
  currentAddress: EmbeddedAddress;

  // แบบสอบข้อเท็จจริง + ผลการสอบ + คะแนนประเมิน
  @Column({
    type: "simple-json",
    nullable: true,
    comment: "แบบสอบข้อเท็จจริง + ผลการสอบ + คะแนนประเมิน"
  })
  factSheetItems: string;

  // สัมภาษณ์โดย
  @Column({ length: 255, default: "", comment: "ชื่อผู้สัมภาษณ์ " })
  interviewerName: string;

  // วันที่สัมภาษณ์
  @Column({ type: "date", nullable: true, comment: "วันที่สัมภาษณ์" })
  interviewDate: Date | string;

  // เห็นสมควรให้กู้ยืม
  @Column({ default: false, comment: "เห็นสมควรให้กู้ยืม" })
  isApproved: boolean;

  // เหตุผลประกอบ
  @Column({ type: "text", nullable: true, comment: "เหตุผลประกอบ" })
  comments: string;

  @Column({ default: 0, comment: "ผลคะแนนคุณสมบัติของผู้กู้" })
  borrowerScore: number;

  @Column({ default: 0, comment: "ผลคะแนนคุณสมบัติของผู้ค้ำ" })
  guarantorScore: number;

  attachedFiles: AttachedFile[];

  getIsApprovedText() {
    return this.isApproved ? "สมควรให้กู้ยืม" : "ไม่สมควรให้กู้ยืม";
  }

  setThaiFormatForReport() {
    this.interviewDate = getThaiPartialDate(this.interviewDate);
  }
}
