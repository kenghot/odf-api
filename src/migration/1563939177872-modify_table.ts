import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyTable1563939177872 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query("ALTER TABLE `guarantees` DROP COLUMN `isActive`");
    await queryRunner.query(
      "ALTER TABLE `requests` ADD `installmentFirstDate` date NULL COMMENT 'ผ่อนชำระงวดแรกวันที่' COMMENT 'ผ่อนชำระงวดแรกวันที่' "
    );
    await queryRunner.query(
      "ALTER TABLE `requests` ADD `installmentLastDate` date NULL COMMENT 'ผ่อนชำระงวดสุดท้ายให้เสร็จสิ้นภายในวันที่' COMMENT 'ผ่อนชำระงวดสุดท้ายให้เสร็จสิ้นภายในวันที่' "
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` ADD `dueDate` date NULL COMMENT 'วันที่ครบกำหนดชำระ' COMMENT 'วันที่ครบกำหนดชำระ' "
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` CHANGE `payBy` `payBy` int NULL COMMENT 'รหัสผู้ใช้งานของผู้จ่ายเงิน'"
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` CHANGE `approvedBy` `approvedBy` int NULL COMMENT 'รหัสผู้ใช้งานของผู้อนุมัติ'"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // await queryRunner.query(
    //   "ALTER TABLE `vouchers` CHANGE `approvedBy` `approvedBy` int NOT NULL COMMENT 'รหัสผู้ใช้งานของผู้อนุมัติ'"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `vouchers` CHANGE `payBy` `payBy` int NOT NULL COMMENT 'รหัสผู้ใช้งานของผู้จ่ายเงิน'"
    // );
    await queryRunner.query("ALTER TABLE `vouchers` DROP COLUMN `dueDate`");
    await queryRunner.query(
      "ALTER TABLE `requests` DROP COLUMN `installmentLastDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `requests` DROP COLUMN `installmentFirstDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantees` ADD `isActive` tinyint NOT NULL COMMENT 'สถานะสัญญาค้ำประกัน  ปกติ หรือ ยกเลิก' DEFAULT '1'"
    );
  }
}
