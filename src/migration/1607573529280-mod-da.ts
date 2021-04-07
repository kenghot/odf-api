import { MigrationInterface, QueryRunner } from "typeorm";

export class modDa1607573529280 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` DROP COLUMN `organization2`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` ADD `receiptOrganization` varchar(128) NOT NULL COMMENT 'หน่วยงานที่รับเรื่อง' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` ADD `note` text NULL COMMENT 'หมายเหตุ'"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` DROP COLUMN `note`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` DROP COLUMN `receiptOrganization`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` ADD `organization2` varchar(128) NOT NULL COMMENT 'หน่วยงานที่รับเรื่อง' DEFAULT ''"
    );
  }
}
