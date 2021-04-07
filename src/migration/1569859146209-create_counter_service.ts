import { MigrationInterface, QueryRunner } from "typeorm";

export class createCounterService1569859146209 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "CREATE TABLE `counter_services` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `TX_ID` varchar(255) NULL, `LOG_ID` varchar(255) NULL, `VENDOR_ID` varchar(255) NULL, `SERVICE_ID` varchar(255) NULL, `METHOD` varchar(255) NULL, `COUNTER_NO` varchar(255) NULL, `TERM_NO` varchar(255) NULL, `POS_TAX_ID` varchar(255) NULL, `SERVICE_RUN_NO` varchar(255) NULL, `RECORD_STATUS` varchar(255) NULL, `CLIENT_SERVICE_RUNNO` varchar(255) NULL, `AMOUNT_RECEIVED` varchar(255) NULL, `VAT_AMOUNT` varchar(255) NULL, `BILL_TYPE` varchar(255) NULL, `REFERENCE_1` varchar(255) NULL, `REFERENCE_2` varchar(255) NULL, `REFERENCE_3` varchar(255) NULL, `REFERENCE_4` varchar(255) NULL, `CUSTOMER_NAME` varchar(255) NULL, `CUSTOMER_ADDR_1` varchar(255) NULL, `CUSTOMER_ADDR_2` varchar(255) NULL, `CUSTOMER_ADDR_3` varchar(255) NULL, `CUSTOMER_TEL_NO` varchar(255) NULL, `ZONE` varchar(255) NULL, `R_SERVICE_RUNNO` varchar(255) NULL, `CANCEL_OPERATING` varchar(255) NULL, `OPERATE_BY_STAFF` varchar(255) NULL, `SYSTEM_DATE_TIME` varchar(255) NULL, `USERID` varchar(255) NULL, `PASSWORD` varchar(255) NULL, `SUCCESS` tinyint NULL, `CODE` varchar(255) NULL, `DESC` varchar(255) NULL, `RETURN1` varchar(255) NULL, `RETURN2` varchar(255) NULL, `RETURN3` varchar(255) NULL, `PRINT_SLIP` varchar(255) NULL, `type` varchar(255) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query("DROP TABLE `counter_services`");
  }
}
