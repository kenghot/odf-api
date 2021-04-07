import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne
} from "typeorm";
import { guaranteeStatusSet, loanTypeSet } from "../enumset";
import { getThaiPartialDate } from "../utils/datetime-helper";
import { idcardFormatting, fullNameFormatting } from "../utils/format-helper";
import { convertFullMoney } from "../utils/money-to-thai-text";
import { Agreement } from "./Agreement";
import { EmbeddedAddressShort } from "./embedded/EmbeddedAddressShort";
import { GuaranteeItem } from "./GuaranteeItem";
import { BaseEntity } from "./inherited/BaseEntity";
import { Organization } from "./Organization";
import { Request } from "./Request";

@Entity("guarantees")
export class Guarantee extends BaseEntity {
  // หน่วยงานที่ทำสัญญาค้ำประกัน
  @Column({ nullable: false, comment: "หน่วยงานที่ทำสัญญาค้ำประกัน" })
  organizationId: number;
  @ManyToOne(() => Organization)
  organization: Organization;

  // รหัสอ้างอิงสำหรับออกรายงานแบบ force
  @Column({ default: "", comment: "รหัสอ้างอิงสำหรับออกรายงานแบบ force" })
  refReportCode: string;

  // ปีงบประมาณ
  @Column({ default: "", comment: "ปีงบประมาณ" })
  fiscalYear: string;

  // วันที่ทำสัญญา
  @Column({ type: "date", nullable: true, comment: "วันที่ทำสัญญา" })
  documentDate: Date | string;

  // เลขที่สัญญา
  @Column({ length: 48, comment: "เลขที่สัญญา" })
  documentNumber: string;

  // ประเภท รายบุคคล / กลุ่ม
  @Column({
    comment: `ประเภท รายบุคคล / กลุ่ม personal = "P", group = "G"`
  })
  guaranteeType: loanTypeSet;

  // ชื่อคำร้อง ถ้าเป็นแบบกลุ่มใส่ชื่อกลุ่ม ถ้าแบบรายบุคคลใส่ {title}{firstname} {lastname}
  @Column({
    length: 255,
    default: "",
    comment:
      "ชื่อคำร้อง ถ้าเป็นแบบกลุ่มใส่ชื่อกลุ่ม ถ้าแบบรายบุคคลใส่ {title}{firstname} {lastname}"
  })
  name: string;
  // สถานะสัญญา
  // normal = "NM",  ปกติ
  // cancel = "CL", ยกเลิก
  @Column({
    default: guaranteeStatusSet.new,
    comment: `สถานะสัญญาค้ำประกัน new = "NW" เตรียมทำสัญญา normal = "NM" ปกติ, cancel = "CL" ยกเลิก`
  })
  status: guaranteeStatusSet;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่เริ่มสัญญา: ปกติจะตรงกับวันที่ documentDate"
  })
  startDate: Date;

  @Column({
    type: "date",
    nullable: true,
    comment: "วันที่สิ้นสุดสัญญา: ให้นับไป 3 ปีจากวันที่ทำสัญญา"
  })
  endDate: Date | string;

  @Column({ type: "date", nullable: true, comment: "วันทียกเลิกสัญญา" })
  cancelDate: Date;

  // สถานที่ทำสัญญา
  @Column({ length: 255, default: "", comment: "สถานที่ทำสัญญา" })
  signLocation: string;

  // สถานที่ทำสัญญา ที่อยู่
  @Column(() => EmbeddedAddressShort)
  signLocationAddress: EmbeddedAddressShort;

  // รายชื่อผู้ค้ำ
  @OneToMany(
    () => GuaranteeItem,
    (guaranteeItem) => guaranteeItem.guarantee,
    {
      cascade: ["insert", "update"]
    }
  )
  guaranteeItems: GuaranteeItem[] | any;

  // ยอดเงินกู้
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ยอดเงินกู้"
  })
  loanAmount: number;

  // สัญญา
  @Column({ nullable: true, comment: "รหัสสัญญา" })
  agreementId: number;
  @OneToOne(
    () => Agreement,
    (agreement) => agreement.guarantee
  )
  @JoinColumn()
  agreement: Agreement;
  @Column({ length: 48, default: "", comment: "เลขที่สัญญา" })
  agreementDocumentNumber: string;
  @Column({ type: "date", nullable: true, comment: "วันที่ลงนามในสัญญาหลัก" })
  agreementDocumentDate: Date | string;

  @Column({ length: 128, default: "", comment: "ผู้มีอำนาจลงนาม : คำนำหหน้า" })
  agreementAuthorizedTitle: string;

  @Column({ length: 128, default: "", comment: "ผู้มีอำนาจลงนาม : ชื่อ" })
  agreementAuthorizedFirstname: string;

  @Column({ length: 128, default: "", comment: "ผู้มีอำนาจลงนาม : นามสกุล" })
  agreementAuthorizedLastname: string;

  @Column({ length: 128, default: "", comment: "ผู้มีอำนาจลงนาม : ตำแหน่ง" })
  agreementAuthorizedPosition: string;

  @Column({
    length: 128,
    default: "",
    comment: "ผู้มีอำนาจลงนาม : คำสั่งเลขที่"
  })
  agreementAuthorizedCommandNo: string;

  @Column({
    type: "date",
    nullable: true,
    comment: "ผู้มีอำนาจลงนาม : คำสั่งลงวันที่"
  })
  agreementAuthorizedCommandDate: Date;

  // คำร้อง
  @Column({ nullable: true, comment: "รหัสคำร้อง" })
  requestId: number;
  @ManyToOne(() => Request)
  @JoinColumn()
  request: Request;

  // // สถานะสัญญาค้ำประกัน
  // @Column({ default: true, comment: "สถานะสัญญาค้ำประกัน  ปกติ หรือ ยกเลิก" })
  // isActive: boolean;

  @Column({ length: 255, default: "", comment: "พยานคนที่1" })
  witness1: string;

  @Column({ length: 255, default: "", comment: "พยานคนที่2" })
  witness2: string;

  @Column({ default: "", comment: "เหตุผลในการยกเลิกสัญญา" })
  guaranteeCancelReason: string;

  @Column({ default: false })
  isAudited: boolean;
  @Column({ type: "text", nullable: true })
  auditRemarks: string;

  loanAmountText: string | undefined;
  agreementAuthorizedFullName: string | undefined;

  setAge() {
    this.guaranteeItems.forEach((g) => {
      if (g.guarantor) {
        g.guarantor.setAge(this.documentDate);
      }
      if (g.borrower) {
        g.borrower.setAge(this.documentDate);
      }
    });
  }

  setThaiFormatForReport() {
    if (this.guaranteeItems) {
      this.guaranteeItems.forEach((ai) => {
        if (ai.borrower) {
          ai.borrower.fullName = fullNameFormatting(
            ai.borrower.title,
            ai.borrower.firstname,
            ai.borrower.lastname
          );
        }
        if (ai.guarantor) {
          ai.guarantor.idCardNo = idcardFormatting(ai.guarantor.idCardNo);
          ai.guarantor.fullName = fullNameFormatting(
            ai.guarantor.title,
            ai.guarantor.firstname,
            ai.guarantor.lastname
          );
        }
      });
    }
    this.loanAmountText =
      this.loanAmount > 0 && convertFullMoney(Number(this.loanAmount));
    this.agreementAuthorizedFullName = fullNameFormatting(
      this.agreementAuthorizedTitle,
      this.agreementAuthorizedFirstname,
      this.agreementAuthorizedLastname
    );
  }

  setName() {
    if (
      this.guaranteeType === loanTypeSet.personal &&
      this.guaranteeItems &&
      this.guaranteeItems[0] &&
      this.guaranteeItems[0].guarantor
    ) {
      this.name = `${this.guaranteeItems[0].guarantor.title}${this.guaranteeItems[0].guarantor.firstname} ${this.guaranteeItems[0].guarantor.lastname}`;
    }
  }

  // @AfterLoad()
  // doSomethingAfterLoad() {
  //   if (this.agreement && this.agreement.id === null) {
  //     delete this.agreement;
  //   }
  // }

  @BeforeInsert()
  private doSomethingBeforeInsert() {
    try {
      // this.setName();
      if (this.guaranteeType === loanTypeSet.personal && this.guaranteeItems) {
        this.name = this.guaranteeItems[0]
          ? this.guaranteeItems[0].getGuarantorFullname()
          : "";
      }
      // this.setAge();
    } catch (e) {
      throw e;
    }
  }

  @BeforeUpdate()
  doSomethingBeforeUpdate() {
    try {
      // this.setName();
      if (this.guaranteeType === loanTypeSet.personal && this.guaranteeItems) {
        this.name = this.guaranteeItems[0]
          ? this.guaranteeItems[0].getGuarantorFullname()
          : "";
      }
    } catch (e) {
      throw e;
    }
  }
}
