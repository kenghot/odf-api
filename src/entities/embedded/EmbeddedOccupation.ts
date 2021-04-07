import { Column } from "typeorm";

export class EmbeddedOccupation {
  // รหัสอาชีพ
  @Column({ nullable: true, comment: "รหัสอาชีพ" })
  id: string;

  // ชื่ออาชีพ
  @Column({ length: 128, default: "", comment: " ชื่ออาชีพ" })
  name: string;

  // คำอธิบาย
  @Column({ length: 128, default: "", comment: "คำอธิบาย" })
  description: string;

  // เงินเดือน
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "เงินเดือน"
  })
  salary: number;
}
