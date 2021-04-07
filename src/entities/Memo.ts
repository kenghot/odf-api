import { Column, Entity } from "typeorm";
import {
  guarantorBorrowerRelationshipSet,
  memoInformerTypeSet
} from "../enumset";
import { AttachedFile } from "./AttachedFile";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { EmbeddedOccupation } from "./embedded/EmbeddedOccupation";
import { BaseEntity } from "./inherited/BaseEntity";
import { getThaiPartialDate } from "../utils/datetime-helper";

@Entity("memos")
export class Memo extends BaseEntity {
  // reference ID
  @Column({ type: "bigint", nullable: true })
  refId: number;
  // reference type : "DEBTCOLLECTION"
  @Column({ nullable: true })
  refType: string;

  // สถานที่จดบันทึก ดึงข้อมูลอัตโนมัตจาก organization
  @Column({
    length: 255,
    default: "",
    comment: "สถานที่จดบันทึก ดึงข้อมูลอัตโนมัตจาก organization"
  })
  location: string;
  // วันที่จดบันทึก
  @Column({ type: "date", nullable: true, comment: "วันที่จดบันทึก" })
  documentDate: Date | string;

  // เวลาที่จดบันทึก
  @Column({ type: "time", nullable: true, comment: "เวลาที่จดบันทึก" })
  documentTime: string;

  // ประเภท รายบุคคล / กลุ่ม
  @Column({
    nullable: true,
    comment: `ประเภท ผู้ขอกู้ = "B", ผู้ค้ำ = "G", ผู้ทราบข้อมูลผู้กู้ = "BW" , ผู้ทราบข้อมูลผู้ค้ำ = "GW" `
  })
  memoInformer: memoInformerTypeSet;

  @Column({
    comment: `ความสัมพันธ์ของผู้ให้ข้อมูลกับผู้กู้ผู้ค้ำ(กรณีที่ไม่ใช่เจ้าตัว) children = 0,relative = 1, friend = 2,`
  })
  memoInformerRelationship: guarantorBorrowerRelationshipSet;

  @Column({ length: 128, default: "", comment: "คำนำหน้าชื่อ" })
  title: string;

  @Column({ length: 128, default: "", comment: "ชื่อ" })
  firstname: string;

  @Column({ length: 128, default: "", comment: "นามสกุล" })
  lastname: string;

  @Column({ comment: "อายุ" })
  age: number;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันเกิด >> หากไม่ทราบวันเกิดจะระบุเป็นวันที่  1/1/YYYY"
  })
  birthDate: Date;

  @Column({ default: false, comment: "ไม่ทราบวันเกิด" })
  isOnlyBirthYear: boolean;

  @Column({ comment: "สถานะการประกอบอาชีพ  ทำงาน/ไม่ทำงาน" })
  isWorking: boolean;

  @Column(() => EmbeddedOccupation)
  occupation: EmbeddedOccupation;

  @Column(() => EmbeddedAddress)
  currentAddress: EmbeddedAddress;

  @Column({ length: 64, default: "", comment: "หมายเลขโทรศัพท์มือถือ" })
  mobilePhone: string;

  @Column({ length: 256, default: "", comment: "หัวข้อบันทึก" })
  memoTitle: string;
  @Column({ length: 512, default: "", comment: "ข้อความที่ให้ถ้อยคำ" })
  memoNote: string;

  @Column({ length: 255, default: "", comment: "ชื่อผู้บันทึก" })
  interviewerName: string;

  @Column({ length: 255, default: "", comment: "ตำแหน่งผู้บันทึก" })
  interviewerPosition: string;

  // เหตุผลประกอบ
  @Column({ default: "", comment: "เหตุผลประกอบ" })
  comments: string;

  attachedFiles: AttachedFile[];
}
