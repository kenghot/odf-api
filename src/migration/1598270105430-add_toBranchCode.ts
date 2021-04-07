import { MigrationInterface, QueryRunner } from "typeorm";

export class addToBranchCode1598270105430 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `vouchers` ADD `toBranchCode` varchar(16) NOT NULL COMMENT 'รหัสสาขา' DEFAULT ''"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `vouchers` DROP COLUMN `toBranchCode`"
    );
  }
}
