import { MigrationInterface, QueryRunner } from "typeorm";

export class modTableOrgVoucher1582171724639 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `bankName` varchar(16) NOT NULL COMMENT 'ชื่อธนาคาร เป็น list ให้เลือก KTB = \"KTB\"' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `bankBranchCode` varchar(8) NOT NULL COMMENT 'รหัสสาขา' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `bankAccountName` varchar(255) NOT NULL COMMENT 'ชื่อบัญชีธนาคาร' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `bankAccountNo` varchar(16) NOT NULL COMMENT 'เลขทีบัญชีธนาคาร' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` ADD `toEmail` varchar(128) NULL COMMENT 'อีเมล'"
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` ADD `toAccountBranch` varchar(255) NOT NULL COMMENT 'สาขา' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` ADD `toAccountType` varchar(255) NOT NULL COMMENT 'ประเภทบัญชี' DEFAULT ''"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `vouchers` DROP COLUMN `toAccountType`"
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` DROP COLUMN `toAccountBranch`"
    );
    await queryRunner.query("ALTER TABLE `vouchers` DROP COLUMN `toEmail`");
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `bankAccountNo`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `bankAccountName`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `bankBranchCode`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `bankName`"
    );
  }
}
