import { Column } from "typeorm";

export class EmbeddedDeathNotification {
  @Column({ default: false, comment: "ยืนยันการเสียชีวิต" })
  isConfirm: boolean;

  @Column({ type: "date", nullable: true, comment: "วันที่ได้รับการ" })
  notificationDate: Date | string;

  @Column({ length: 128, default: "", comment: "รหัสตำบล" })
  name: string;

  @Column({ length: 128, default: "", comment: "ตำบล" })
  position: string;
}
