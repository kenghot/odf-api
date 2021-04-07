import { MigrationInterface, QueryRunner } from "typeorm";

export class indexIdCardNo1582216999816 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "CREATE INDEX `IDX_50fa4042e70dac6ac8e4d32a86` ON `agreement_items` (`borrowerIdCardNo`)"
    );
    await queryRunner.query(
      "CREATE INDEX `IDX_bdc7d728408360167a8c319526` ON `agreement_items` (`guarantorIdCardNo`)"
    );
    await queryRunner.query(
      "CREATE INDEX `IDX_4e651ccb68bedde6912ff44a1b` ON `guarantee_items` (`guarantorIdCardNo`)"
    );
    await queryRunner.query(
      "CREATE INDEX `IDX_3b31b69ba3ed48e582ed554ad9` ON `guarantee_items` (`borrowerIdCardNo`)"
    );
    await queryRunner.query(
      "CREATE INDEX `IDX_1f411f01b0ea3ee8f73983c98b` ON `request_fact_sheets` (`borrowerIdCardNo`)"
    );
    await queryRunner.query(
      "CREATE INDEX `IDX_c5484ffa8ad59d792acf373bfc` ON `request_items` (`spouseIdCardNo`)"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "DROP INDEX `IDX_c5484ffa8ad59d792acf373bfc` ON `request_items`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_1f411f01b0ea3ee8f73983c98b` ON `request_fact_sheets`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_3b31b69ba3ed48e582ed554ad9` ON `guarantee_items`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_4e651ccb68bedde6912ff44a1b` ON `guarantee_items`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_bdc7d728408360167a8c319526` ON `agreement_items`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_50fa4042e70dac6ac8e4d32a86` ON `agreement_items`"
    );
  }
}
