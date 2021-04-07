import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyTableStage51574931804312 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `poses` ADD `printerIP` varchar(255) NULL COMMENT 'ip ของ printer ที่ต่อกับ Pos' COMMENT 'ip ของ printer ที่ต่อกับ Pos' "
    );
    await queryRunner.query(
      "ALTER TABLE `poses` ADD `printerPort` varchar(255) NULL COMMENT 'port ของ printer ที่ต่อกับ Pos' COMMENT 'port ของ printer ที่ต่อกับ Pos' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `posId` bigint NOT NULL COMMENT 'รหัสจุดรับชำระ' COMMENT 'รหัสจุดรับชำระ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `documentDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `documentDate` datetime NULL COMMENT 'วันที่ในเอกสาร' COMMENT 'วันที่ในเอกสาร' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD CONSTRAINT `FK_17143f80c4803f680fcc7a44535` FOREIGN KEY (`posId`) REFERENCES `poses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP FOREIGN KEY `FK_17143f80c4803f680fcc7a44535`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `documentDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `documentDate` date NULL COMMENT 'วันที่ในเอกสาร'"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `posId`");
    await queryRunner.query("ALTER TABLE `poses` DROP COLUMN `printerPort`");
    await queryRunner.query("ALTER TABLE `poses` DROP COLUMN `printerIP`");
  }
}
