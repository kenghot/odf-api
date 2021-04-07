import { MigrationInterface, QueryRunner } from "typeorm";

export class addIsauditedAuditremarks1569871411402
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `guarantees` ADD `isAudited` tinyint NOT NULL DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantees` ADD `auditRemarks` text NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `agreements` ADD `isAudited` tinyint NOT NULL DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `agreements` ADD `auditRemarks` text NULL"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `agreements` DROP COLUMN `auditRemarks`"
    );
    await queryRunner.query("ALTER TABLE `agreements` DROP COLUMN `isAudited`");
    await queryRunner.query(
      "ALTER TABLE `guarantees` DROP COLUMN `auditRemarks`"
    );
    await queryRunner.query("ALTER TABLE `guarantees` DROP COLUMN `isAudited`");
  }
}
