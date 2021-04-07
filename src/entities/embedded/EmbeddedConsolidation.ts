import { Column } from "typeorm";
import { resultTypeSet } from "../../enumset";
import { getEnumSetText } from "../../utils/get-enum-set-text";
import { getThaiPartialDate } from "../../utils/datetime-helper";

export class EmbeddedConsolidation {
  @Column({ type: "date", nullable: true, comment: "วันประชุม" })
  meetingDate: Date | string;

  @Column({ default: "", comment: "เป็นการประชุมครั้งที่" })
  meetingNumber: string;

  // ผลการพิจารณา
  @Column({
    nullable: true,
    comment: `ผลการพิจารณา  approve = "AP", adjust = "AJ",reject = "RJ"`
  })
  result: resultTypeSet;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "วงเงินที่อนุมัติ"
  })
  approveBudget: number;

  @Column({ type: "text", nullable: true, comment: "ความเห็น" })
  comments: string;

  setThaiFormatForReport() {
    this.meetingDate = getThaiPartialDate(this.meetingDate);
    this.result = getEnumSetText("resultType", this.result);
  }
}
