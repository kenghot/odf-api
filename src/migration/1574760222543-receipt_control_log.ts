import { MigrationInterface, QueryRunner } from "typeorm";

export class receiptControlLog1574760222543 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "CREATE TABLE `receipt_control_logs` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `posId` bigint NOT NULL COMMENT 'จุดรับชำระ', `documentDate` date NULL COMMENT 'วันที่ในเอกสาร', `onDutymanagerId` bigint NULL COMMENT 'ผู้อนุมัติ', `userId` bigint NULL COMMENT 'ผู้ขอเบิก', `logType` varchar(255) NOT NULL DEFAULT 'REQUEST', `status` varchar(255) NOT NULL COMMENT 'สถานะของการควบคุมใบเสร็จ' DEFAULT 'WT', `requestQuantity` int NOT NULL COMMENT 'จำนวนที่ร้องขอ' DEFAULT 0, `approveQuantity` int NOT NULL COMMENT 'จำนวนเบิกที่อนุมัติ' DEFAULT 0, `unit` varchar(255) NOT NULL COMMENT 'หน่วยวัด' DEFAULT 'COIL', PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "ALTER TABLE `poses` ADD `onhandReceipt` int NOT NULL COMMENT 'จำนวนใบเสร็จคงเหลือ' DEFAULT 0 COMMENT 'จำนวนใบเสร็จคงเหลือ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_control_logs` ADD CONSTRAINT `FK_84b6f0b20f648605603f40abe8f` FOREIGN KEY (`posId`) REFERENCES `poses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_control_logs` ADD CONSTRAINT `FK_7577a6dc7e134f3d113299c00ac` FOREIGN KEY (`onDutymanagerId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_control_logs` ADD CONSTRAINT `FK_6feebc905b505508d94ab0952ab` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `receipt_control_logs` DROP FOREIGN KEY `FK_6feebc905b505508d94ab0952ab`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_control_logs` DROP FOREIGN KEY `FK_7577a6dc7e134f3d113299c00ac`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_control_logs` DROP FOREIGN KEY `FK_84b6f0b20f648605603f40abe8f`"
    );
    await queryRunner.query("ALTER TABLE `poses` DROP COLUMN `onhandReceipt`");
    await queryRunner.query("DROP TABLE `receipt_control_logs`");
  }
}
