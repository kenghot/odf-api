import { Column, Entity, ManyToOne } from "typeorm";

import { BaseEntity } from "./inherited/BaseEntity";
import { Request } from "./Request";

@Entity("budget_allocation_items")
export class BudgetAllocationItem extends BaseEntity {
  // คำร้อง
  @Column({ nullable: true, comment: "คำร้อง" })
  requestId: number;
  @ManyToOne(
    () => Request,
    (request) => request.budgetAllocationItems,
    {
      onDelete: "CASCADE"
    }
  )
  request: Request;

  // รายการ
  @Column({ length: 255, default: "", comment: "รายการ" })
  description: string;

  // จำนวน
  @Column({ default: 1, comment: "จำนวน" })
  quality: number;

  // ราคา
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ราคา"
  })
  cost: number;

  // ราคารวม
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
    comment: "ราคารวม"
  })
  subTotal: number;
}
