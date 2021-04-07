import { Column, Entity, Index } from "typeorm";
import { EmbeddedFile } from "./embedded/EmbeddedFile";
import { BaseEntity } from "./inherited/BaseEntity";

@Entity("attached_files")
@Index(["refId", "refType"])
export class AttachedFile extends BaseEntity {
  // reference ID
  @Column({ type: "bigint", nullable: true })
  refId: number;
  // reference type : "USER" , "REQUEST.BORROWER"
  @Column({ nullable: true })
  refType: string;

  // รหัสเอกสาร
  @Column({ nullable: true, comment: "รหัสเอกสาร" })
  documentCode: string;
  // ชื่อเอกสาร
  @Column({ nullable: true, comment: "ชื่อเอกสาร" })
  documentName: string;
  // ผ่านการตรวจสอบ?
  @Column({ length: 4, nullable: true, comment: "ผ่านการตรวจสอบ" })
  isVerified: string;
  // ตรวจสอบเอกสารโดย
  @Column({ nullable: true, comment: "ตรวจสอบเอกสารโดย" })
  verfiedBy: string;
  @Column({ length: 4, nullable: true, comment: "" })
  isSend: string;
  @Column({ default: "", comment: "รายละเอียดเอกสารแนบ" })
  documentDescription: string;

  // file
  @Column(() => EmbeddedFile)
  file: EmbeddedFile;
}
