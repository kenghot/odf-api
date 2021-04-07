import { MigrationInterface, QueryRunner } from "typeorm";

export class modDeathNoti1604320709777 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `debt_collections` MODIFY `deathNotificationName` varchar(128) NOT NULL COMMENT 'รหัสตำบล' DEFAULT ''"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
