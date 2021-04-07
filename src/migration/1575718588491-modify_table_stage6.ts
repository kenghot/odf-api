import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyTableStage61575718588491 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `debt_collection_visits` ADD `contactTelephone` varchar(255) NOT NULL COMMENT 'หมายเลขโทรศัพท์ผู้ติดต่อ' DEFAULT '' COMMENT 'หมายเลขโทรศัพท์ผู้ติดต่อ' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementPreAccountReceivableDocumentNumber` varchar(255) NULL COMMENT 'เลขที่เอกสารลูกหนี้เดิม' COMMENT 'เลขที่เอกสารลูกหนี้เดิม' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementPreDebtCollectionId` int NULL COMMENT 'การติดตามหนี้' COMMENT 'การติดตามหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collection_letters` CHANGE `isCollectable` `isCollectable` tinyint NULL COMMENT 'ติดต่อชำระเงิน / ไม่ติดต่อชำระเงิน'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collection_visits` CHANGE `isMeetTarget` `isMeetTarget` tinyint NULL COMMENT 'พบ / ไม่พบ'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_print_logs` ADD `printedDatetime` datetime NULL COMMENT 'วันที่พิมพ์ซ้ำ' COMMENT 'วันที่พิมพ์/พิมพ์ซ้ำ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` MODIFY `documentDate` date NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` MODIFY `paidDate` datetime NULL"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `printCount`");
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `cancelApprovedBy`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `cancelApprovedByName`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `organizationAddressLine1` varchar(256) NOT NULL COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่1' DEFAULT '' COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่1' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `organizationAddressLine2` varchar(256) NOT NULL COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่2' DEFAULT '' COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่2' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `organizationAddressLine3` varchar(256) NOT NULL COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่3' DEFAULT '' COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่3' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `organizationAddressLine4` varchar(256) NOT NULL COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่4' DEFAULT '' COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จบรรทัดที่4' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `cancelApprovedManagerName` varchar(255) NULL COMMENT 'เจ้าหน้าที่ประจำจุดรับชำระ - ชื่อ' COMMENT 'เจ้าหน้าที่ประจำจุดรับชำระ - ชื่อ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `cancelApprovedManagerPosition` varchar(255) NULL COMMENT 'เจ้าหน้าที่ประจำจุดรับชำระ - ตำแหน่ง' COMMENT 'เจ้าหน้าที่ประจำจุดรับชำระ - ตำแหน่ง' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `organizationAddress`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collection_letters` CHANGE `isSentBack` `isSentBack` tinyint NULL COMMENT 'จดหมายถูกตีกลับ'"
    );
    await queryRunner.query(
      "CREATE INDEX `IDX_77016b8d5263d7acd918783789` ON `attached_files` (`refId`, `refType`)"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "DROP INDEX `IDX_77016b8d5263d7acd918783789` ON `attached_files`"
    );
    // await queryRunner.query(
    //   "ALTER TABLE `debt_collection_letters` CHANGE `isSentBack` `isSentBack` tinyint NOT NULL COMMENT 'จดหมายถูกตีกลับ' DEFAULT '0'"
    // );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `organizationAddress` varchar(256) NOT NULL COMMENT 'ที่อยู่หน่วยงานบนใบเสร็จ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `cancelApprovedManagerPosition`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `cancelApprovedManagerName`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `organizationAddressLine4`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `organizationAddressLine3`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `organizationAddressLine2`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `organizationAddressLine1`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `cancelApprovedByName` int NULL COMMENT 'ผู้อนุมัติการยกเลิก-ชื่อ'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `cancelApprovedBy` int NULL COMMENT 'ผู้อนุมัติการยกเลิก-รหัสผู้ใช้งาน'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `printCount` int NOT NULL COMMENT 'จำนวนครั้งที่พิมพ์ใบเสร็จ' DEFAULT '0'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` MODIFY `paidDate` date NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` MODIFY `documentDate` datetime NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_print_logs` DROP COLUMN `printedDatetime`"
    );
    // await queryRunner.query(
    //   "ALTER TABLE `debt_collection_visits` CHANGE `isMeetTarget` `isMeetTarget` tinyint NOT NULL COMMENT 'พบ / ไม่พบ' DEFAULT '0'"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `debt_collection_letters` CHANGE `isCollectable` `isCollectable` tinyint NOT NULL COMMENT 'ติดต่อชำระเงิน / ไม่ติดต่อชำระเงิน' DEFAULT '0'"
    // );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementPreDebtCollectionId`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementPreAccountReceivableDocumentNumber`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collection_visits` DROP COLUMN `contactTelephone`"
    );
  }
}
