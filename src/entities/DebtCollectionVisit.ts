import { Column, Entity, ManyToOne } from "typeorm";
import { visitTypeSet } from "../enumset";
import { getThaiPartialDate } from "../utils/datetime-helper";
import { AttachedFile } from "./AttachedFile";
import { DebtCollection } from "./DebtCollection";
import { EmbeddedAddress } from "./embedded/EmbeddedAddress";
import { EmbeddedOccupation } from "./embedded/EmbeddedOccupation";
import { BaseEntity } from "./inherited/BaseEntity";

@Entity("debt_collection_visits")
export class DebtCollectionVisit extends BaseEntity {
  @Column({ nullable: false, comment: "รายการติดตามทวงหนี้" })
  debtCollectionId: number;
  @ManyToOne(
    () => DebtCollection,
    (dc) => dc.letters,
    {
      onDelete: "CASCADE"
    }
  )
  debtCollection: DebtCollection;

  // วันที่เข้าเยี่ยม
  @Column({ type: "date", nullable: true, comment: "วันที่สัมภาษณ์" })
  visitDate: Date | string;

  @Column({
    comment: `รูปแบบการเข้าเยี่ยม: "DCB" = debt collection bollower เข้าติดตามทวงถามผู้กู้, "DCG" = debt collection gurantor เข้าติดตามทวงถามผู้ค้ำ`
  })
  visitType: visitTypeSet;

  @Column({ nullable: true, comment: "พบ / ไม่พบ" })
  isMeetTarget: boolean;

  @Column({
    length: 128,
    default: "",
    comment: "คำอธิบาย สาเหตุที่ไม่ชำระเงิน"
  })
  overdueReasons: string;

  @Column({ length: 128, default: "", comment: "คำอธิบาย สาเหตุที่ไม่พบ" })
  dismissReason: string;

  // ที่อยู่ปัจจุบัน จะมีค่าเมื่อ currentAddressType = 2
  @Column(() => EmbeddedAddress)
  currentAddress: EmbeddedAddress;

  @Column({ comment: "สถานะการประกอบอาชีพ  ทำงาน/ไม่ทำงาน" })
  isWorking: boolean;
  @Column(() => EmbeddedOccupation)
  occupation: EmbeddedOccupation;

  @Column({ comment: "มีีรายได้อื่นๆ" })
  hasExtraIncome: boolean;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "รายได้อื่นๆ"
  })
  extraIncome: number;

  @Column({ length: 128, default: "", comment: "คำอธิบาย รายได้อื่นๆ" })
  extraIncomeDescription: string;

  @Column({ comment: "สมาชิกในครอบครัว" })
  familyMember: number;

  @Column({ length: 128, default: "", comment: "คำอธิบาย สมาชิกในครอบครัว" })
  familyMemberDescription: string;

  @Column({
    length: 128,
    default: "",
    comment: "ภาระที่ต้องรับผิดชอบค่าใช้จ่าย"
  })
  expenseDeclaration: string;

  @Column({ length: 256, default: "", comment: "ปัญหาด้านสุขภาพ" })
  problem1: string;

  @Column({ length: 256, default: "", comment: "ปัญหาด้านการประกอบอาชีพ" })
  problem2: string;

  @Column({ length: 256, default: "", comment: "ปัญหาด้านอื่นๆ" })
  problem3: string;

  @Column({ length: 256, default: "", comment: "การสืบหาฯ-ภาระหนี้สิน" })
  inspection1: string;

  @Column({
    length: 256,
    default: "",
    comment: "การสืบหาฯ-ทรัพย์สินของผู้กู้ยืม"
  })
  inspection2: string;

  @Column({
    length: 256,
    default: "",
    comment: "การสืบหาฯ-สิทธิเรียกร้องจากบุคคลภายนอก"
  })
  inspection3: string;

  // สัมภาษณ์โดย
  @Column({ length: 255, default: "", comment: "ชื่อผู้สัมภาษณ์" })
  visitorName: string;

  // สัมภาษณ์โดย
  @Column({ length: 255, default: "", comment: "ตำแหน่งผู้สัมภาษณ์" })
  visitorPosition: string;

  // เหตุผลประกอบ
  @Column({ default: "", comment: "ข้อสังเกตของเจ้าหน้าที่เกี่ยวกับผู้กู้ยืม" })
  comments: string;

  @Column({ default: "", comment: "หมายเลขโทรศัพท์ผู้ติดต่อ" })
  contactTelephone: string;

  attachedFiles: AttachedFile[];

  setThaiFormatForReport() {
    this.visitDate = getThaiPartialDate(this.visitDate);
    if (this.debtCollection) {
      this.debtCollection.setThaiFormatForReport();
    }
  }
}
