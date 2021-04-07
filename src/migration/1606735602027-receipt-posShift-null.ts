import { MigrationInterface, QueryRunner } from "typeorm";

export class receiptPosShiftNull1606735602027 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP FOREIGN KEY `FK_78026fc8a876261f75efe23a359`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `posShiftId` `posShiftId` bigint NULL COMMENT 'รหัสรอบการทำงาน ณ จุดรับชำระ'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD CONSTRAINT `FK_78026fc8a876261f75efe23a359` FOREIGN KEY (`posShiftId`) REFERENCES `pos_shifts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP FOREIGN KEY `FK_78026fc8a876261f75efe23a359`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `posShiftId` `posShiftId` bigint NOT NULL COMMENT 'รหัสรอบการทำงาน ณ จุดรับชำระ'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD CONSTRAINT `FK_78026fc8a876261f75efe23a359` FOREIGN KEY (`posShiftId`) REFERENCES `pos_shifts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
  }
}
