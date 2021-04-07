import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyArControl1576813179426 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` MODIFY `asOfDate` datetime NULL"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` MODIFY `asOfDate` date NULL"
    );
  }
}
