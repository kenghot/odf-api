import { Column, Entity } from "typeorm";
import { occupationTypeSet } from "../enumset";
import { BaseEntity } from "./inherited/BaseEntity";

@Entity("occupations")
export class Occupation extends BaseEntity {
  @Column({ length: 128, default: "", comment: "ชื่ออาชีพ" })
  name: string;

  @Column({
    comment: `ประเภทอาชีพ borrower = 0, guarantor = 1, request = 2,`
  })
  occupationType: occupationTypeSet;

  @Column({ default: false, comment: "สถานะเปิด/ปิดการใช้งาน" })
  active: boolean;
}
