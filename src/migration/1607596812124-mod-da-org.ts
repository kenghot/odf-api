import { MigrationInterface, QueryRunner } from "typeorm";

export class modDaOrg1607596812124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `donationAuthorizedTitle` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนามขอบคุณเงินบริจาค คำนำหน้าชื่อ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `donationAuthorizedFirstname` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนามขอบคุณเงินบริจาค ชื่อ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `donationAuthorizedLastname` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนามขอบคุณเงินบริจาค นามสกุล' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `donationAuthorizedPosition` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนามขอบคุณเงินบริจาค ตำแหน่ง' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` ADD `paidAmount` decimal(10,2) NOT NULL COMMENT 'จำนวนเงินที่ชำระ' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP FOREIGN KEY `FK_78026fc8a876261f75efe23a359`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `posShiftId` `posShiftId` bigint NOT NULL COMMENT 'รหัสรอบการทำงาน ณ จุดรับชำระ'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD CONSTRAINT `FK_78026fc8a876261f75efe23a359` FOREIGN KEY (`posShiftId`) REFERENCES `pos_shifts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP FOREIGN KEY `FK_78026fc8a876261f75efe23a359`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `posShiftId` `posShiftId` bigint NULL COMMENT 'รหัสรอบการทำงาน ณ จุดรับชำระ'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD CONSTRAINT `FK_78026fc8a876261f75efe23a359` FOREIGN KEY (`posShiftId`) REFERENCES `pos_shifts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` DROP COLUMN `paidAmount`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `donationAuthorizedPosition`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `donationAuthorizedLastname`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `donationAuthorizedFirstname`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `donationAuthorizedTitle`"
    );
  }
}
