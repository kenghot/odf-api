import { MigrationInterface, QueryRunner } from "typeorm";

export class modOrgSpecialpos1607058760924 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `specialPOS` text NULL"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `specialPOS`"
    );
  }
}
