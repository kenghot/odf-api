import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyTableStage41573196537662 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `refId` `refId` varchar(255) NULL COMMENT 'เลขที่อ้างอิงในระบบ'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `ref1` `ref1` varchar(255) NULL COMMENT 'เลขที่อ้างอิง1 ขึ้นอยู่กับประเภท refType'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `ref2` `ref2` varchar(255) NULL COMMENT 'เลขที่อ้างอิง2 ขึ้นอยู่กับประเภท refType'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `ref3` `ref3` varchar(255) NULL COMMENT 'เลขที่อ้างอิง3 ขึ้นอยู่กับประเภท refType'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `ref4` `ref4` varchar(255) NULL COMMENT 'เลขที่อ้างอิง4 ขึ้นอยู่กับประเภท refType'"
    );
    // temp
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `cancelApprovedManagerId` bigint NULL COMMENT 'เจ้าหน้าที่ประจำจุดรับชำระ' COMMENT 'เจ้าหน้าที่ประจำจุดรับชำระ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD CONSTRAINT `FK_7534fc8c52acec7d61451d2f408` FOREIGN KEY (`cancelApprovedManagerId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );

    // temp
    // aws
    await queryRunner.query(
      "ALTER TABLE `receipt_items` DROP FOREIGN KEY `FK_44ebeb9f67a4d4ccd7c9d3c275e`"
    );

    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `receiptId` `receiptId` bigint NOT NULL COMMENT 'รหัสใบเสร็จ'"
    );

    // aws
    await queryRunner.query(
      "ALTER TABLE `receipt_print_logs` DROP FOREIGN KEY `FK_9deba303f7e6451672ad234ba87`"
    );

    await queryRunner.query(
      "ALTER TABLE `receipt_print_logs` CHANGE `receiptId` `receiptId` bigint NOT NULL COMMENT 'รหัสใบเสร็จ'"
    );

    // aws
    // await queryRunner.query(
    //   "ALTER TABLE `receipt_items` ADD CONSTRAINT `FK_44ebeb9f67a4d4ccd7c9d3c275e` FOREIGN KEY (`receiptId`) REFERENCES `receipts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    // );
    await queryRunner.query(
      "ALTER TABLE `receipt_print_logs` ADD CONSTRAINT `FK_9deba303f7e6451672ad234ba87` FOREIGN KEY (`receiptId`) REFERENCES `receipts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    // await queryRunner.query(
    //   "ALTER TABLE `receipts` ADD CONSTRAINT `FK_78026fc8a876261f75efe23a359` FOREIGN KEY (`posShiftId`) REFERENCES `pos_shifts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // aws
    // await queryRunner.query(
    //   "ALTER TABLE `receipts` DROP FOREIGN KEY `FK_78026fc8a876261f75efe23a359`"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `receipt_print_logs` DROP FOREIGN KEY `FK_9deba303f7e6451672ad234ba87`"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `receipt_items` DROP FOREIGN KEY `FK_44ebeb9f67a4d4ccd7c9d3c275e`"
    // );

    await queryRunner.query(
      "ALTER TABLE `receipt_print_logs` CHANGE `receiptId` `receiptId` bigint NULL COMMENT 'รหัสใบเสร็จ'"
    );

    // aws
    // await queryRunner.query(
    //   "ALTER TABLE `receipt_print_logs` ADD CONSTRAINT `FK_9deba303f7e6451672ad234ba87` FOREIGN KEY (`receiptId`) REFERENCES `receipts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    // );

    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `receiptId` `receiptId` bigint NULL COMMENT 'รหัสใบเสร็จ'"
    );

    // aws
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD CONSTRAINT `FK_44ebeb9f67a4d4ccd7c9d3c275e` FOREIGN KEY (`receiptId`) REFERENCES `receipts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );

    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `ref4` `ref4` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิง4 ขึ้นอยู่กับประเภท refType'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `ref3` `ref3` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิง3 ขึ้นอยู่กับประเภท refType'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `ref2` `ref2` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิง2 ขึ้นอยู่กับประเภท refType'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `ref1` `ref1` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิง1 ขึ้นอยู่กับประเภท refType'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `refId` `refId` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิงในระบบ'"
    );

    await queryRunner.query(
      "ALTER TABLE `receipts` DROP FOREIGN KEY `FK_7534fc8c52acec7d61451d2f408`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `cancelApprovedManagerId`"
    );
  }
}
