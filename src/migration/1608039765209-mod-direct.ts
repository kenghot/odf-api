import { MigrationInterface, QueryRunner } from "typeorm";

export class modDirect1608039765209 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `donation_directs` ADD `deliveryAddress` text NULL COMMENT 'ที่อยู่จัดส่ง'"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `donation_directs` DROP COLUMN `deliveryAddress`"
    );
  }
}
