import { MigrationInterface, QueryRunner } from "typeorm";

export class modReceipt1607746692913 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `clientTitle` varchar(255) NOT NULL COMMENT 'ลูกค้า:  ชื่อ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `clientFirstname` varchar(255) NOT NULL COMMENT 'ลูกค้า:  ชื่อ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `clientLastname` varchar(255) NOT NULL COMMENT 'ลูกค้า:  ชื่อ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` ADD `donatorIdCardNo` varchar(13) NOT NULL COMMENT 'หมายเลขบัตรประชาชน' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` ADD `donatorTitle` varchar(128) NOT NULL COMMENT 'คำนำหน้าชื่อ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` ADD `donatorFirstname` varchar(128) NOT NULL COMMENT 'คำนำหน้าชื่อ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` ADD `donatorLastname` varchar(128) NOT NULL COMMENT 'คำนำหน้าชื่อ' DEFAULT ''"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `donation_directs` DROP COLUMN `donatorLastname`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` DROP COLUMN `donatorFirstname`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` DROP COLUMN `donatorTitle`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` DROP COLUMN `donatorIdCardNo`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `clientLastname`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `clientFirstname`"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `clientTitle`");
  }
}
