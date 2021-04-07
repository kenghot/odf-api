import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyOrg1576906668371 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "CREATE INDEX `IDX_c4be72b7c1a92a2af4244b2d58` ON `organizations` (`orgCode`)"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "DROP INDEX `IDX_c4be72b7c1a92a2af4244b2d58` ON `organizations`"
    );
  }
}
