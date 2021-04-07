import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity("counter_services")
@Index(["TX_ID", "METHOD", "type", "SUCCESS"])
export class CounterService {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;
  @CreateDateColumn({ nullable: true, comment: "วันที่สร้าง" })
  createdDate: Date | string;
  @Column({ nullable: true, comment: "" })
  type: string;
  @Column({ nullable: true, comment: "" })
  csMethod: string;

  @Column({ nullable: true, comment: "" })
  TX_ID: string;
  @Column({ nullable: true, comment: "" })
  LOG_ID: string;
  @Column({ nullable: true, comment: "" })
  VENDOR_ID: string;
  @Column({ nullable: true, comment: "" })
  SERVICE_ID: string;
  @Column({ nullable: true, comment: "" })
  METHOD: string;
  @Column({ nullable: true, comment: "" })
  COUNTER_NO: string;
  @Column({ nullable: true, comment: "" })
  TERM_NO: string;
  @Column({ nullable: true, comment: "" })
  POS_TAX_ID: string;
  @Column({ nullable: true, comment: "" })
  SERVICE_RUN_NO: string;
  @Column({ nullable: true, comment: "" })
  RECORD_STATUS: string;
  @Column({ nullable: true, comment: "" })
  CLIENT_SERVICE_RUNNO: string;
  @Column({ nullable: true, comment: "" })
  AMOUNT_RECEIVED: string;
  @Column({ nullable: true, comment: "" })
  VAT_AMOUNT: string;
  @Column({ nullable: true, comment: "" })
  BILL_TYPE: string;
  @Column({ nullable: true, comment: "" })
  REFERENCE_1: string;
  @Column({ nullable: true, comment: "" })
  REFERENCE_2: string;
  @Column({ nullable: true, comment: "" })
  REFERENCE_3: string;
  @Column({ nullable: true, comment: "" })
  REFERENCE_4: string;
  @Column({ nullable: true, comment: "" })
  CUSTOMER_NAME: string;
  @Column({ nullable: true, comment: "" })
  CUSTOMER_ADDR_1: string;
  @Column({ nullable: true, comment: "" })
  CUSTOMER_ADDR_2: string;
  @Column({ nullable: true, comment: "" })
  CUSTOMER_ADDR_3: string;
  @Column({ nullable: true, comment: "" })
  CUSTOMER_TEL_NO: string;
  @Column({ nullable: true, comment: "" })
  ZONE: string;
  @Column({ nullable: true, comment: "" })
  R_SERVICE_RUNNO: string;
  @Column({ nullable: true, comment: "" })
  CANCEL_OPERATING: string;
  @Column({ nullable: true, comment: "" })
  OPERATE_BY_STAFF: string;
  @Column({ nullable: true, comment: "" })
  SYSTEM_DATE_TIME: string;
  @Column({ nullable: true, select: false, comment: "" })
  USERID: string;
  @Column({ nullable: true, select: false, comment: "" })
  PASSWORD: string;
  @Column({ nullable: true, comment: "" })
  SUCCESS: boolean;
  @Column({ nullable: true, comment: "" })
  CODE: string;
  @Column({ nullable: true, comment: "" })
  DESC: string;
  @Column({ nullable: true, comment: "" })
  RETURN1: string;
  @Column({ nullable: true, comment: "" })
  RETURN2: string;
  @Column({ nullable: true, comment: "" })
  RETURN3: string;
  @Column({ nullable: true, comment: "" })
  PRINT_SLIP: string;
}
