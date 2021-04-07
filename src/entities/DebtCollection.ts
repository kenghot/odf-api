import moment = require("moment");
import {
  AfterLoad,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany
} from "typeorm";
import {
  accountReceiviableStatusSet,
  debtInterruptReasonSet
} from "../enumset";
import { AccountReceivable } from "./AccountReceivable";
import { AttachedFile } from "./AttachedFile";
import { DebtCollectionLetter } from "./DebtCollectionLetter";
import { DebtCollectionVisit } from "./DebtCollectionVisit";
import { EmbeddedDeathNotification } from "./embedded/EmbeddedDeathNotification";
import { EmbeddedDebtSue } from "./embedded/EmbeddedDebtSue";
import { BaseEntity } from "./inherited/BaseEntity";
import { Memo } from "./Memo";

@Entity("debt_collections")
export class DebtCollection extends BaseEntity {
  @Column({ nullable: false, comment: "บัญชีลูกหนี้" })
  accountReceivableId: number;
  @ManyToOne(
    () => AccountReceivable,
    (ar) => ar.collections,
    {
      onDelete: "CASCADE"
    }
  )
  accountReceivable: AccountReceivable;

  @Column({
    nullable: true,
    comment: `สาเหตุการสะดุดอายุความ : "P" = ชำระเงิน {paid} , "AD" = รับสภาพหนี้ {ackOfDebt} , "D" = ผู้กู้เสียชีวิต {dead}, "AF" = รับสภาพความผิดในกรณีหมดอายุความไปแล้ว {ackAfter}`
  })
  interruptReason: debtInterruptReasonSet;

  // reference ID
  @Column({ type: "bigint", nullable: true })
  interruptRefId: number;
  // reference type : "ACCOUNT_RECEIVABLE_TRANSACTION"
  @Column({ nullable: true })
  interruptRefType: string;

  @Column({ nullable: true, comment: "หมายเหตุ" })
  comments: string;

  // ข้อมูลการส่งจดหมายทวงถามและ จดหมายยกเลิก
  @OneToMany(
    () => DebtCollectionLetter,
    (letter) => letter.debtCollection,
    {
      cascade: ["insert", "update"]
    }
  )
  letters: DebtCollectionLetter[];

  // ข้อมูลการลงเยี่ยม
  @OneToMany(
    () => DebtCollectionVisit,
    (letter) => letter.debtCollection,
    {
      cascade: ["insert", "update"]
    }
  )
  visits: DebtCollectionVisit[];

  // ข้อมูลการตัดจ่ายลูกหนี้ และ การส่งฟ้่องศาล
  @Column(() => EmbeddedDebtSue)
  debtSue: EmbeddedDebtSue;

  @Column({ default: 0, comment: "ขั้นตอนการติดตามล่าสุด" })
  step: number;

  @Column({
    default: false,
    comment: "สถานะบ่งบอกว่าเป็นรายการติดตามหนี้ล่าสุด"
  })
  active: boolean;

  // แจ้งตาย
  @Column(() => EmbeddedDeathNotification)
  deathNotification: EmbeddedDeathNotification;

  attachedFiles: AttachedFile[];
  debtSueAttachedFiles: AttachedFile[];
  debtAcknowledgementAttachedFiles: AttachedFile[];
  prescriptionRemainingMonth: number;
  memos: Memo[];

  @AfterLoad()
  doSomethingAfterLoad() {
    if (this.debtSueAttachedFiles) {
      this.debtSue.attachedFiles = this.debtSueAttachedFiles;
    }
    // if (this.debtAcknowledgementAttachedFiles) {
    //   this.debtAcknowledgement.attachedFiles = this.debtAcknowledgementAttachedFiles;
    // }
    delete this.debtSueAttachedFiles;
    delete this.debtAcknowledgementAttachedFiles;
    if (this.accountReceivable) {
      this.accountReceivable.caseExpirationDate = this.getCaseExpirationDate();
    }
  }

  getCaseExpirationDate() {
    if (this.deathNotification && this.deathNotification.isConfirm) {
      const date = moment(this.deathNotification.notificationDate);

      return date.add(1, "year").format("YYYY-MM-DD");
    } else {
      const date = moment(this.accountReceivable.startOverdueDate);
      return date.add(5, "year").format("YYYY-MM-DD");
    }
  }

  setThaiFormatForReport() {
    // if (this.debtAcknowledgement) {
    //   this.debtAcknowledgement.setThaiFormatForReport();
    // }
    if (this.accountReceivable) {
      this.accountReceivable.setThaiFormatForReport();
    }
  }

  interruptData(
    interruptReason: debtInterruptReasonSet,
    interruptRefType?: string,
    interruptRefId?: number
  ) {
    this.active = false;
    this.interruptReason = interruptReason;
    this.interruptRefType = interruptRefType;
    this.interruptRefId = interruptRefId;
  }
}
