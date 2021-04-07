import { Column, JoinColumn, OneToOne } from "typeorm";
import { getThaiPartialDate } from "../../utils/datetime-helper";
import { Agreement } from "../Agreement";
import { AttachedFile } from "../AttachedFile";

export class EmbeddedDebtAcknowledgement {
  @Column({ nullable: true, comment: "บัญชีลูกหนี้เดิม" })
  preAccountReceivableId: number;

  @Column({ nullable: true, comment: "เลขที่เอกสารลูกหนี้เดิม" })
  preAccountReceivableDocumentNumber: string;

  @Column({ nullable: true, comment: "การติดตามหนี้" })
  preDebtCollectionId: number;

  @Column({ default: false, comment: "ยืนยันการรับสภาพหนี้" })
  isAcknowledge: boolean;

  @Column({
    length: 13,
    default: "",
    comment: "หมายเลขบัตรประชาชนผู้รับสภาพหนี้"
  })
  idCardNo: string;

  @Column({ length: 128, default: "", comment: "คำนำหน้าชื่อผู้รับสภาพหนี้" })
  title: string;

  @Column({ length: 128, default: "", comment: "ชื่อผู้รับสภาพหนี้" })
  firstname: string;

  @Column({ length: 128, default: "", comment: "นามสกุลผู้รับสภาพหนี้" })
  lastname: string;

  @Column({ length: 64, default: "", comment: "หมายเลขโทรศัพท์ผู้รับสภาพหนี้" })
  telephone: string;

  @Column({ default: false, comment: "เป็นตัวแทนของผู้กู้" })
  isBehalf: boolean;

  @Column({
    length: 255,
    default: "",
    comment: "สถานที่รับสภาพหนี้"
  })
  location: string;

  // วันที่รับสภาพหนี้
  @Column({ type: "date", nullable: true, comment: "วันที่รับสภาพหนี้" })
  acknowledgeDate: Date | string;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันเกิด >> หากไม่ทราบวันเกิดจะระบุเป็นวันที่  1/1/YYYY"
  })
  birthDate: Date;

  @Column({ default: false, comment: "ไม่ทราบวันเกิด" })
  isOnlyBirthYear: boolean;

  @Column({
    length: 64,
    default: "",
    comment: "ในฐานะผู้จัดการมรดกหรือทายาทของ"
  })
  onBehalfOf: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดหนี้ที่ยอมรับ"
  })
  debtAmount: number;

  attachedFiles: AttachedFile[];

  setThaiFormatForReport() {
    this.acknowledgeDate = getThaiPartialDate(this.acknowledgeDate);
  }
}
