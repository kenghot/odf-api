import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @CreateDateColumn({ nullable: true, comment: "วันที่สร้าง" })
  createdDate: Date | string;

  @UpdateDateColumn({
    nullable: true,
    comment: "วันที่ปรับปรุง",
  })
  updatedDate: Date | string;

  @Column({ nullable: true, comment: "รหัสผู้ใช้ที่สร้าง" })
  createdBy: number;

  @Column({ default: "", comment: "ชื่อผู้ใช้ที่สร้าง" })
  createdByName: string;

  @Column({
    nullable: true,
    comment: "รหัสผู้ใช้ที่ปรับปรุงล่าสุด",
  })
  updatedBy: number;

  @Column({ default: "", comment: "ชื่อผู้ใช้ที่ปรับปรุงล่าสุด" })
  updatedByName: string;

  logCreatedBy?(body: any) {
    const createdBy = body.createdBy
      ? body.createdBy
      : body.updatedBy
      ? body.updatedBy
      : null;
    const createdByName = body.createdByName
      ? body.createdByName
      : body.updatedByName
      ? body.updatedByName
      : "";
    this.createdBy = createdBy || undefined;
    this.createdByName = createdByName || undefined;
  }
  logUpdatedBy?(body: any) {
    const updatedBy = body.updatedBy
      ? body.updatedBy
      : body.createdBy
      ? body.createdBy
      : null;
    const updatedByName = body.updatedByName
      ? body.updatedByName
      : body.createdByName
      ? body.createdByName
      : "";
    this.updatedBy = updatedBy || undefined;
    this.updatedByName = updatedByName || undefined;
  }
}
