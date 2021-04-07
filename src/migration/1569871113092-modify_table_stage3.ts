import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyTableStage31569871113092 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query("ALTER TABLE `memos` MODIFY `refId` bigint NULL");
    await queryRunner.query(
      "ALTER TABLE `counter_services` ADD `csMethod` varchar(255) NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `region` varchar(64) NOT NULL COMMENT 'ภาค' DEFAULT '' COMMENT 'ภาค' "
    );
    // await queryRunner.query(
    //   "DROP INDEX `IDX_19a3005f0f5aaa83a15cd63b65` ON `guarantees`"
    // );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_transactions` MODIFY `paymentId` bigint NULL COMMENT 'รหัสการชำระเงิน อ้างอิงตาม reference type เช่น ถ้า reference Type เป็น KTB ref.id จะตรงกับ id ของตาราง KTB' COMMENT 'รหัสการชำระเงิน อ้างอิงตาม reference type เช่น ถ้า reference Type เป็น KTB ref.id จะตรงกับ id ของตาราง KTB' "
    );
    await queryRunner.query(
      "CREATE INDEX `IDX_e2e652a166136af4ba8c44ab13` ON `account_receivable_transactions` (`paymentType`, `status`, `paymentReferenceNo`)"
    );
    await queryRunner.query(
      "CREATE INDEX `IDX_d7bf2b18f5326b11a8279c9a4c` ON `counter_services` (`TX_ID`, `METHOD`, `type`, `SUCCESS`)"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "DROP INDEX `IDX_d7bf2b18f5326b11a8279c9a4c` ON `counter_services`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_e2e652a166136af4ba8c44ab13` ON `account_receivable_transactions`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_transactions` MODIFY `paymentId` int NULL COMMENT 'รหัสการชำระเงิน อ้างอิงตาม reference type เช่น ถ้า reference Type เป็น KTB ref.id จะตรงกับ id ของตาราง KTB'"
    );
    // await queryRunner.query(
    //   "CREATE UNIQUE INDEX `IDX_19a3005f0f5aaa83a15cd63b65` ON `guarantees` (`documentNumber`)"
    // );
    await queryRunner.query("ALTER TABLE `organizations` DROP COLUMN `region`");
    await queryRunner.query(
      "ALTER TABLE `counter_services` DROP COLUMN `csMethod`"
    );
    await queryRunner.query("ALTER TABLE `memos` MODIFY `refId` int NULL");
  }
}
