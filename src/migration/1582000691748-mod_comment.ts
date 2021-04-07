import { MigrationInterface, QueryRunner } from "typeorm";

export class modComment1582000691748 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `request_fact_sheets` MODIFY `comments` text NULL COMMENT 'เหตุผลประกอบ'"
    );
    await queryRunner.query(
      "ALTER TABLE `requests` MODIFY `result1Comments` text NULL COMMENT 'ความเห็น'"
    );
    await queryRunner.query(
      "ALTER TABLE `requests` MODIFY `result2Comments` text NULL COMMENT 'ความเห็น'"
    );
    await queryRunner.query(
      "ALTER TABLE `requests` MODIFY `result3Comments` text NULL COMMENT 'ความเห็น'"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // await queryRunner.query(
    //   "ALTER TABLE `requests` MODIFY `result3Comments` varchar(255) NOT NULL COMMENT 'ความเห็น' DEFAULT ''"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `requests` MODIFY `result2Comments` varchar(255) NOT NULL COMMENT 'ความเห็น' DEFAULT ''"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `requests` MODIFY `result1Comments` varchar(255) NOT NULL COMMENT 'ความเห็น' DEFAULT ''"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `request_fact_sheets` MODIFY `comments` varchar(255) NOT NULL COMMENT 'เหตุผลประกอบ' DEFAULT ''"
    // );
  }
}
