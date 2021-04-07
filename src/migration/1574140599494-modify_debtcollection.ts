import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyDebtCollection1574140599494 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "CREATE TABLE `account_receivable_controls` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `accountReceivableId` bigint NOT NULL COMMENT 'บัญชีลูกหนี้', `asOfDate` date NULL COMMENT 'ข้อมูลประมวนผล ณ วันที่', `outstandingDebtBalance` decimal(10,2) NOT NULL COMMENT 'ยอดคงเหลือล่าสุด (หนี้คงค้าง)' DEFAULT 0, `expectedPaidAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินที่ควรต้องชำระ' DEFAULT 0, `totalPaidAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินที่ชำระแล้วทั้งหมด' DEFAULT 0, `overDueBalance` decimal(10,2) NOT NULL COMMENT 'จำนวนเงินคงค้างที่เลยกำหนดชำระ คำนวนจาก expectedPaidAmount - totalPaidAmount' DEFAULT 0, `paidRatio` decimal(10,2) NOT NULL COMMENT 'อัตราการชำระหนี้เทียบกับที่หนี้ที่ควรจะต้องจ่าย ณ งวดปัจจุบัน คิดเป็น% = totalPaidAmount/ expectedPaidAmount หนี้ที่ควรจะจ่าย ณ​ ปัจจุบัน  ' DEFAULT 0, `paidPercentage` decimal(10,2) NOT NULL COMMENT 'สัดส่วนการชำระหนี้ ว่าชำหนี้ทั้งหมดมาแล้วกี่% = (LoanAmount - outstandingDebtBalance)/LoanAmount' DEFAULT 0, `status` varchar(255) NOT NULL COMMENT 'สถานนะค้างชำระ ตามกฎหมาย นับจากวันที่เริ่มผิดนัดชำระ' DEFAULT '0', PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementIsAcknowledge`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementIdCardNo`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementTitle`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementFirstname`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementLastname`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementTelephone`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementIsBehalf`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementLocation`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementAcknowledgeDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementBirthDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementIsOnlyBirthYear`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementOnBehalfOf`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementOutstandingDebtBalance`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `debtAcknowledgementInstallmentAmount`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `paidTimeCounts`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `paidInstallmentCount`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `overDueBalance`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `paidRatio`"
    );
    // await queryRunner.query(
    //   "ALTER TABLE `account_receivables` DROP COLUMN `borrowerContactAddressAttachedFiles`"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `account_receivables` DROP COLUMN `guarantorContactAddressAttachedFiles`"
    // );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `unpaidMonthCountsInArow`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `paidPercentage`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `tentativeOverdueDate` date NULL COMMENT 'วันที่จะเริ่มนับว่ามีการผิดนัดชำระครั่้งถัดไป' COMMENT 'วันที่จะเริ่มนับว่ามีการผิดนัดชำระครั่้งถัดไป' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementPreAccountReceivableId` int NOT NULL COMMENT 'บัญชีลูกหนี้เดิม' COMMENT 'บัญชีลูกหนี้เดิม' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementIsAcknowledge` tinyint NOT NULL COMMENT 'ยืนยันการรับสภาพหนี้' DEFAULT 0 COMMENT 'ยืนยันการรับสภาพหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementIdCardNo` varchar(13) NOT NULL COMMENT 'หมายเลขบัตรประชาชนผู้รับสภาพหนี้' DEFAULT '' COMMENT 'หมายเลขบัตรประชาชนผู้รับสภาพหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementTitle` varchar(128) NOT NULL COMMENT 'คำนำหน้าชื่อผู้รับสภาพหนี้' DEFAULT '' COMMENT 'คำนำหน้าชื่อผู้รับสภาพหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementFirstname` varchar(128) NOT NULL COMMENT 'ชื่อผู้รับสภาพหนี้' DEFAULT '' COMMENT 'ชื่อผู้รับสภาพหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementLastname` varchar(128) NOT NULL COMMENT 'นามสกุลผู้รับสภาพหนี้' DEFAULT '' COMMENT 'นามสกุลผู้รับสภาพหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementTelephone` varchar(64) NOT NULL COMMENT 'หมายเลขโทรศัพท์ผู้รับสภาพหนี้' DEFAULT '' COMMENT 'หมายเลขโทรศัพท์ผู้รับสภาพหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementIsBehalf` tinyint NOT NULL COMMENT 'เป็นตัวแทนของผู้กู้' DEFAULT 0 COMMENT 'เป็นตัวแทนของผู้กู้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementLocation` varchar(255) NOT NULL COMMENT 'สถานที่รับสภาพหนี้' DEFAULT '' COMMENT 'สถานที่รับสภาพหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementAcknowledgeDate` date NULL COMMENT 'วันที่รับสภาพหนี้' COMMENT 'วันที่รับสภาพหนี้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementBirthDate` date NULL COMMENT 'วันเกิด >> หากไม่ทราบวันเกิดจะระบุเป็นวันที่  1/1/YYYY' COMMENT 'วันเกิด >> หากไม่ทราบวันเกิดจะระบุเป็นวันที่  1/1/YYYY' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementIsOnlyBirthYear` tinyint NOT NULL COMMENT 'ไม่ทราบวันเกิด' DEFAULT 0 COMMENT 'ไม่ทราบวันเกิด' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementOnBehalfOf` varchar(64) NOT NULL COMMENT 'ในฐานะผู้จัดการมรดกหรือทายาทของ' DEFAULT '' COMMENT 'ในฐานะผู้จัดการมรดกหรือทายาทของ' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `debtAcknowledgementDebtAmount` decimal(10,2) NOT NULL COMMENT 'ยอดหนี้ที่ยอมรับ' DEFAULT 0 COMMENT 'ยอดหนี้ที่ยอมรับ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `description4` varchar(128) NOT NULL COMMENT 'คำอธิบาย บรรทัด4' DEFAULT '' COMMENT 'คำอธิบาย บรรทัด4' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `cancelApprovedBy` int NULL COMMENT 'ผู้อนุมัติการยกเลิก-รหัสผู้ใช้งาน' COMMENT 'ผู้อนุมัติการยกเลิก-รหัสผู้ใช้งาน' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `cancelApprovedByName` int NULL COMMENT 'ผู้อนุมัติการยกเลิก-ชื่อ' COMMENT 'ผู้อนุมัติการยกเลิก-ชื่อ' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD CONSTRAINT `FK_b28b159595a231fb52127df5cbf` FOREIGN KEY (`accountReceivableId`) REFERENCES `account_receivables`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `prescriptionStartDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `prescriptionValue`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `prescriptionUnit`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `interruptRefId` bigint NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `interruptRefType` varchar(255) NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` CHANGE `debtAcknowledgementPreAccountReceivableId` `debtAcknowledgementPreAccountReceivableId` int NULL COMMENT 'บัญชีลูกหนี้เดิม'"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `comments` varchar(255) NOT NULL COMMENT 'หมายเหตุ' DEFAULT '' COMMENT 'หมายเหตุ' "
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `comments`"
    );
    // await queryRunner.query(
    //   "ALTER TABLE `account_receivables` CHANGE `debtAcknowledgementPreAccountReceivableId` `debtAcknowledgementPreAccountReceivableId` int NOT NULL COMMENT 'บัญชีลูกหนี้เดิม'"
    // );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `interruptRefType`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` DROP COLUMN `interruptRefId`"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `prescriptionUnit` varchar(255) NOT NULL COMMENT 'หน่วยนับอายุความ' DEFAULT 'YEAR'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `prescriptionValue` int NOT NULL COMMENT 'อายุความ' DEFAULT '0'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `prescriptionStartDate` date NULL COMMENT 'วันที่เริ่มนับอายุความ'"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP FOREIGN KEY `FK_b28b159595a231fb52127df5cbf`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `cancelApprovedByName`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `cancelApprovedBy`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` DROP COLUMN `description4`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementDebtAmount`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementOnBehalfOf`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementIsOnlyBirthYear`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementBirthDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementAcknowledgeDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementLocation`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementIsBehalf`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementTelephone`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementLastname`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementFirstname`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementTitle`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementIdCardNo`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementIsAcknowledge`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `debtAcknowledgementPreAccountReceivableId`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` DROP COLUMN `tentativeOverdueDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `paidPercentage` decimal(10,2) NOT NULL COMMENT 'สัดส่วนการชำระหนี้ ว่าชำหนี้ทั้งหมดมาแล้วกี่% = (LoanAmount - outstandingDebtBalance)/LoanAmount' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `unpaidMonthCountsInArow` int NOT NULL COMMENT 'จำนวนเดือนที่ขาดการชำระโดยต่อเนื่อง ถ้ามีการชำระจะถูก reset เป็น 0 เสมอ' DEFAULT '0'"
    );
    // await queryRunner.query(
    //   "ALTER TABLE `account_receivables` ADD `guarantorContactAddressAttachedFiles` text NULL"
    // );
    // await queryRunner.query(
    //   "ALTER TABLE `account_receivables` ADD `borrowerContactAddressAttachedFiles` text NULL"
    // );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `paidRatio` decimal(10,2) NOT NULL COMMENT 'อัตรากราชำระหนี้เทียวกับที่ครบกำหนด คิดเป็น % (20 หมายถึง 20%)' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `overDueBalance` decimal(10,2) NOT NULL COMMENT 'จำนวนเงินคงค้างที่เลยกำหนดชำระ' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `paidInstallmentCount` int NOT NULL COMMENT 'จำนวนครั้งที่จ่าย นับตามบัญชีนับว่าจ่ายกี่งวด คำนวนตามยอดเงิน' DEFAULT '0'"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivables` ADD `paidTimeCounts` int NOT NULL COMMENT 'จำนวนครั้งที่จ่าย' DEFAULT '0'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementInstallmentAmount` decimal(10,2) NOT NULL COMMENT 'จำนวนเงินชำระต่องวด' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementOutstandingDebtBalance` decimal(10,2) NOT NULL COMMENT 'ยอดคงเหลือล่าสุด (หนี้คงค้าง)' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementOnBehalfOf` varchar(64) NOT NULL COMMENT 'ในฐานะผู้จัดการมรดกหรือทายาทของ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementIsOnlyBirthYear` tinyint NOT NULL COMMENT 'ไม่ทราบวันเกิด' DEFAULT '0'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementBirthDate` date NULL COMMENT 'วันเกิด >> หากไม่ทราบวันเกิดจะระบุเป็นวันที่  1/1/YYYY'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementAcknowledgeDate` date NULL COMMENT 'วันที่รับสภาพหนี้'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementLocation` varchar(255) NOT NULL COMMENT 'สถานที่รับสภาพหนี้' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementIsBehalf` tinyint NOT NULL COMMENT 'เป็นตัวแทนของผู้กู้' DEFAULT '0'"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementTelephone` varchar(64) NOT NULL COMMENT 'หมายเลขโทรศัพท์ผู้รับสภาพหนี้' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementLastname` varchar(128) NOT NULL COMMENT 'นามสกุลผู้รับสภาพหนี้' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementFirstname` varchar(128) NOT NULL COMMENT 'ชื่อผู้รับสภาพหนี้' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementTitle` varchar(128) NOT NULL COMMENT 'คำนำหน้าชื่อผู้รับสภาพหนี้' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementIdCardNo` varchar(13) NOT NULL COMMENT 'หมายเลขบัตรประชาชนผู้รับสภาพหนี้' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `debt_collections` ADD `debtAcknowledgementIsAcknowledge` tinyint NOT NULL COMMENT 'ยืนยันการรับสภาพหนี้' DEFAULT '0'"
    );
    await queryRunner.query("DROP TABLE `account_receivable_controls`");
  }
}
