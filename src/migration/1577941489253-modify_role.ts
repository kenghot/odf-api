import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyRole1577941489253 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `roles` ADD `isPrivate` tinyint NOT NULL DEFAULT 0"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query("ALTER TABLE `roles` DROP COLUMN `isPrivate`");
  }
}
