import { Column, Entity, ManyToOne } from "typeorm";
import { letterSentBackReasonTypeSet, letterTypeSet } from "../enumset";
import { getThaiPartialDate } from "../utils/datetime-helper";
import { AttachedFile } from "./AttachedFile";
import { DebtCollection } from "./DebtCollection";
import { BaseEntity } from "./inherited/BaseEntity";

@Entity("debt_collection_letters")
export class DebtCollectionLetter extends BaseEntity {
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

  @Column({
    comment: `ประเภทจดหมาย "CLB" = หนังสือทวงถามผูักู้ , "CLG" = หนังสือทวงถามผู้ค้้ำ, "CCB" = หนังสือบอกเลิกสัญญาผู้กู้ , "CCG" = หนังสือบอกเลิกสัญญาผู้ค้ำ, "CSH" = หนังสือสืบหาทายาท, "CSM" = หนังสือสืบหาผู้จัดการมรดก, "CLR" = หนังสือแจ้งทายาท/ผู้จัดการมรดก`
  })
  letterType: letterTypeSet;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่ทำหนังสือแจ้ง"
  })
  documentDate: Date;
  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่จัดส่งหนังสือแจ้ง"
  })
  postDate: Date;

  @Column({ nullable: true, comment: "จดหมายถูกตีกลับ" })
  isSentBack: boolean;

  @Column({ nullable: true, comment: "สาเหตุที่ถูกตีกลับ" })
  sentBackReasonType: letterSentBackReasonTypeSet;

  @Column({ nullable: true, comment: "สาเหตุที่ถูกตีกลับ อื่นๆ" })
  sentBackReasonTypeDescription: string;

  @Column({ nullable: true, comment: "ติดต่อชำระเงิน / ไม่ติดต่อชำระเงิน" })
  isCollectable: boolean;

  @Column({ length: 48, comment: "เลขที่หนังสือ" })
  documentNumber: string;

  attachedFiles: AttachedFile[];

  setThaiFormatForReport() {
    this.documentDate = getThaiPartialDate(this.documentDate);
    if (this.debtCollection) {
      this.debtCollection.setThaiFormatForReport();
    }
  }
}
