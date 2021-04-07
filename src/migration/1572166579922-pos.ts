import { MigrationInterface, QueryRunner } from "typeorm";

export class pos1572166579922 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP FOREIGN KEY `FK_c6d17536c937899fe87119ff596`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` CHANGE `receiptSequenceId` `taxNumber` bigint NULL"
    );
    await queryRunner.query(
      "CREATE TABLE `pos_shifts` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `posId` bigint NOT NULL COMMENT 'รหัสจุดรับชำระ', `startedShift` datetime NULL COMMENT 'วันเวลาเริ่มรอบการทำงาน', `endedShift` datetime NULL COMMENT 'วันเวลาปิดรอบการทำงาน', `onDutymanagerId` bigint NULL COMMENT 'ผู้ดูแลการรับชำระ', `currentCashierId` bigint NULL COMMENT 'เจ้าหน้าที่ประจำจุดรับชำระ', `openingAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินเปิดรอบ' DEFAULT 0, `expectedDrawerAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินที่คาดว่าจะมีในลิ้นชัก' DEFAULT 0, `drawerAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินจริงในลิ้นชัก' DEFAULT 0, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `poses` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `organizationId` bigint NOT NULL COMMENT 'หน่วยงานที่ออกใบเสร็จ', `posCode` varchar(8) NOT NULL COMMENT 'รหัสจุดรับชำระ' DEFAULT '', `posName` varchar(8) NOT NULL COMMENT 'ชื่อจุดรับชำระ' DEFAULT '', `registedVAT` tinyint NOT NULL COMMENT 'สถานะเปิด/ปิดการใช้งาน VAT' DEFAULT 0, `registedVATCode` varchar(255) NOT NULL COMMENT 'รหัสอ้างอิงสรรพากร' DEFAULT 0, `managerId` bigint NULL COMMENT 'ผู้ดูแลการรับชำระ / ผู้รับเงิน by default', `receiptSequenceId` bigint NULL COMMENT 'เลขที่ที่ใช้ในการใบเสร็จรับเงิน', `active` tinyint NOT NULL COMMENT 'สถานะเปิด/ปิดการใช้งาน' DEFAULT 0, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    // await queryRunner.query(
    //   "CREATE TABLE `poses` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `organizationId` bigint NOT NULL COMMENT 'หน่วยงานที่ออกใบเสร็จ', `posCode` varchar(8) NOT NULL COMMENT 'รหัสจุดรับชำระ' DEFAULT '', `posName` varchar(8) NOT NULL COMMENT 'ชื่อจุดรับชำระ' DEFAULT '', `registedVAT` tinyint NOT NULL COMMENT 'สถานะเปิด/ปิดการใช้งาน VAT' DEFAULT 0, `registedVATCode` varchar(255) NOT NULL COMMENT 'รหัสอ้างอิงสรรพากร' DEFAULT 0, `managerId` bigint NULL COMMENT 'ผู้ดูแลการรับชำระ / ผู้รับเงิน by default', `receiptSequenceId` bigint NOT NULL COMMENT 'เลขที่ที่ใช้ในการใบเสร็จรับเงิน', `active` tinyint NOT NULL COMMENT 'สถานะเปิด/ปิดการใช้งาน' DEFAULT 0, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    // );
    await queryRunner.query(
      "CREATE TABLE `pos_shift_logs` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `posShiftId` bigint NOT NULL COMMENT 'รหัสรอบการทำงานของจุดรับชำระ', `action` varchar(255) NOT NULL COMMENT 'รูปแบบ action open = \"OPEN\" เปิดรอบการทำงาน, close=\"CLOSE\" ปิดรอบการทำงาน, count_cash = \"COUNT\" นับเงินในลิ้นชัก, add_cash=\"ADD\" เติมเงินเข้าลิ้นชัก, drop_cash = \"DROP\" ชักเงินออกจากลิ้นชัก, cashier_login = \"LOGIN\", cashier_logout = \"LOGOUT\", swap_manager = \"SWAPMNG\",swap_cashier = \"SWAPCSH\"' DEFAULT 'CASH', `transactionAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินเข้า/ออก (+/-)' DEFAULT 0, `expectedDrawerAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินโดยรวม' DEFAULT 0, `note` varchar(512) NOT NULL COMMENT 'หมายเหตุ' DEFAULT '', `refType` varchar(16) NULL COMMENT 'เอกสารอ้างอิงรายการชำระ : RECEIPT', `refId` int NULL COMMENT 'เอกสารอ้างอิงรายการชำระ ใช้คู่กับ refType RECEIPT.Id ', PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `receipt_print_logs` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `receiptId` bigint NULL COMMENT 'รหัสใบเสร็จ', `POSId` int NOT NULL COMMENT 'รหัสจุดรับชำระ', `recieptPrintType` varchar(255) NOT NULL COMMENT 'รูปแบบการปริ้นใบเสร็จ IP: InitPrint (พิมพ์ต้นฉบับ), RP:Reprint (พิมพ์ซ้ำ), CL:Cancel (ปริ้นยกเลิก)' DEFAULT 'IP', `manageBy` int NULL COMMENT 'ผู้ดูแลการรับชำระ-รหัสผู้ใช้งาน', `manageByName` varchar(255) NOT NULL COMMENT 'ผู้ดูแลการรับชำระ-ชื่อ' DEFAULT '', `manageByPosition` varchar(255) NOT NULL COMMENT 'ผู้ดูแลการรับชำระ-ตำแหน่ง' DEFAULT '', PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` DROP COLUMN `description`"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `payerName`");
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `createdByPosition`"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `refId`");
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `refType`");
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `organizationTaxNumber`"
    );
    await queryRunner.query(
      "ALTER TABLE `users` ADD `posPinCode` varchar(32) NOT NULL DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `refType` varchar(16) NOT NULL COMMENT 'เอกสารอ้างอิงรายการชำระ ใช้คู่กับ referencType: AR: AccountRecievable (ชำระคืนเงินกู้) , D: Donation (บริจาคเงินสมทบกองทุนผู้สูงอายุ), PR:ProjectRemaining (ชำระคืนเงินเหลือจ่ายจากการดำเนินโครงการ), O:Other (อื่่นๆ)' COMMENT 'เอกสารอ้างอิงรายการชำระ ใช้คู่กับ referencType: AR: AccountRecievable (ชำระคืนเงินกู้) , D: Donation (บริจาคเงินสมทบกองทุนผู้สูงอายุ), PR:ProjectRemaining (ชำระคืนเงินเหลือจ่ายจากการดำเนินโครงการ), O:Other (อื่่นๆ)' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `refId` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิงในระบบ' COMMENT 'เลขที่อ้างอิงในระบบ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `ref1` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิง1 ขึ้นอยู่กับประเภท refType' COMMENT 'เลขที่อ้างอิง1 ขึ้นอยู่กับประเภท refType' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `ref2` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิง2 ขึ้นอยู่กับประเภท refType' COMMENT 'เลขที่อ้างอิง2 ขึ้นอยู่กับประเภท refType' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `ref3` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิง3 ขึ้นอยู่กับประเภท refType' COMMENT 'เลขที่อ้างอิง3 ขึ้นอยู่กับประเภท refType' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `ref4` varchar(255) NOT NULL COMMENT 'เลขที่อ้างอิง4 ขึ้นอยู่กับประเภท refType' COMMENT 'เลขที่อ้างอิง4 ขึ้นอยู่กับประเภท refType' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `description1` varchar(128) NOT NULL COMMENT 'คำอธิบาย บรรทัด1' DEFAULT '' COMMENT 'คำอธิบาย บรรทัด1' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `description2` varchar(128) NOT NULL COMMENT 'คำอธิบาย บรรทัด2' DEFAULT '' COMMENT 'คำอธิบาย บรรทัด2' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `description3` varchar(128) NOT NULL COMMENT 'คำอธิบาย บรรทัด3' DEFAULT '' COMMENT 'คำอธิบาย บรรทัด3' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `posShiftId` bigint NOT NULL COMMENT 'รหัสรอบการทำงาน ณ จุดรับชำระ' COMMENT 'รหัสรอบการทำงาน ณ จุดรับชำระ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `organizationTaxNo` varchar(16) NOT NULL COMMENT 'หมายเลขผู้เสียภาษีของหน่วยงาน' DEFAULT '' COMMENT 'หมายเลขผู้เสียภาษีของหน่วยงาน' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `POSVATCode` varchar(16) NOT NULL COMMENT 'หมายเลขสรรพากร' DEFAULT '' COMMENT 'หมายเลขสรรพากร' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `clientType` varchar(3) NOT NULL COMMENT 'ลูกค้า:  ประเภท  P: Personal (บุคคลธรรมดา), C: Company (นิติบุคคล)' DEFAULT 'P' COMMENT 'ลูกค้า:  ประเภท  P: Personal (บุคคลธรรมดา), C: Company (นิติบุคคล)' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `clientTelephone` varchar(32) NOT NULL COMMENT 'ลูกค้า: หมายเลขโทรศัพท์' DEFAULT '' COMMENT 'ลูกค้า: หมายเลขโทรศัพท์' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `discountFactor` decimal(10,2) NOT NULL COMMENT '% ส่วนลด (ตัวคูณ ถ้าลด 10% ให้ใส่ 0.1)' DEFAULT 0 COMMENT '% ส่วนลด (ตัวคูณ ถ้าลด 10% ให้ใส่ 0.1)' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `vatIncluded` tinyint NOT NULL COMMENT 'ราคารวมภาษีมูลค่าเพิ่ม' DEFAULT 0 COMMENT 'ราคารวมภาษีมูลค่าเพิ่ม' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `excludeVat` decimal(10,2) NOT NULL COMMENT 'ราคาไม่รวมภาษีมูลค่าเพิ่ม' DEFAULT 0 COMMENT 'ราคาไม่รวมภาษีมูลค่าเพิ่ม' "
    );
    await queryRunner.query(
      'ALTER TABLE `receipts` ADD `paymentMethod` varchar(255) NOT NULL COMMENT \'รูปแบบการชำระเงิน cash = "CASH" เงินสด, moneyOrder = "MONEYORDER" ธนาณัติ, check = "CHECK" เช็ค\' DEFAULT \'CASH\' COMMENT \'รูปแบบการชำระเงิน cash = "CASH" เงินสด, moneyOrder = "MONEYORDER" ธนาณัติ, check = "CHECK" เช็ค\' '
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `paidAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินที่จ่าย' DEFAULT 0 COMMENT 'ยอดเงินที่จ่าย' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `changeAmount` decimal(10,2) NOT NULL COMMENT 'เงินทอน' DEFAULT 0 COMMENT 'เงินทอน' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `paymentBank` varchar(128) NULL COMMENT 'ชื่อธนาคารที่ชำระเงิน' COMMENT 'ชื่อธนาคารที่ชำระเงิน' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `paymentBankBranch` varchar(128) NULL COMMENT 'ชื่อสาขาธนาคาร' COMMENT 'ชื่อสาขาธนาคาร' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `paymentRefNo` varchar(128) NULL COMMENT 'รหัสอ้างอิงการชำระ' COMMENT 'รหัสอ้างอิงการชำระ' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `paidDate` date NULL COMMENT 'วันที่ชำระ' COMMENT 'วันที่ชำระ' "
    );
    await queryRunner.query(
      'ALTER TABLE `receipts` ADD `status` varchar(255) NOT NULL COMMENT \'สถานะคำร้อง paid = "PD" ชำระแล้ว, cancel = "CL" ยกเลิก, \' DEFAULT \'PD\' COMMENT \'สถานะคำร้อง paid = "PD" ชำระแล้ว, cancel = "CL" ยกเลิก, \' '
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `taxNumber`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `taxNumber` varchar(64) NOT NULL COMMENT 'หมายเลขผู้เสียภาษีของหน่วยงาน' DEFAULT '' COMMENT 'หมายเลขผู้เสียภาษีของหน่วยงาน' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `quantity` `quantity` int NOT NULL COMMENT 'จำนวน' DEFAULT 1"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `price` `price` decimal(10,2) NOT NULL COMMENT 'ราคาต่อหน่วย' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `subtotal` `subtotal` decimal(10,2) NOT NULL COMMENT 'ยอดรวมรายการ' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `clientBranch`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `clientBranch` varchar(128) NOT NULL COMMENT 'ลูกค้า: สาขา' DEFAULT '' COMMENT 'ลูกค้า: สาขา' "
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `subtotal` `subtotal` decimal(10,2) NOT NULL COMMENT '1 รวม' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `discount` `discount` decimal(10,2) NOT NULL COMMENT '2 ส่วนลด' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `vat` `vat` decimal(10,2) NOT NULL COMMENT '3 ภาษี' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `withHoldingFactor` `withHoldingFactor` decimal(4,2) NOT NULL COMMENT 'หัก ณ ที่จ่าย (ตัวคูณ ถ้าหัก 3% ให้ใส่ 0.03)' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `withHoldingTax` `withHoldingTax` decimal(10,2) NOT NULL COMMENT '4 หัก ณ ที่จ่าย (คำนวนแล้ว)' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `total` `total` decimal(10,2) NOT NULL COMMENT 'รวมทั้งหมด  = 1 ลบ 2 บวก 3 ลบ 4' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `poses` ADD CONSTRAINT `FK_5e32362bbe271a6959c8a60bd8d` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `poses` ADD CONSTRAINT `FK_91f3a0fc1b9c7e3743a7cb58c27` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `poses` ADD CONSTRAINT `FK_07c46e07bd55564a095a6f64b33` FOREIGN KEY (`receiptSequenceId`) REFERENCES `receipt_sequencies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `pos_shifts` ADD CONSTRAINT `FK_83bd8fc104a7823cbefc586ad84` FOREIGN KEY (`posId`) REFERENCES `poses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `pos_shifts` ADD CONSTRAINT `FK_0cbd91411b5e3d4414cf5c6c1c2` FOREIGN KEY (`onDutymanagerId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `pos_shifts` ADD CONSTRAINT `FK_b274a68b375a0a20c8532703bb4` FOREIGN KEY (`currentCashierId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `pos_shift_logs` ADD CONSTRAINT `FK_d70326af5fcee190fdaeb50656c` FOREIGN KEY (`posShiftId`) REFERENCES `pos_shifts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_print_logs` ADD CONSTRAINT `FK_9deba303f7e6451672ad234ba87` FOREIGN KEY (`receiptId`) REFERENCES `receipts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
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
      "ALTER TABLE `receipt_print_logs` DROP FOREIGN KEY `FK_9deba303f7e6451672ad234ba87`"
    );
    await queryRunner.query(
      "ALTER TABLE `pos_shift_logs` DROP FOREIGN KEY `FK_d70326af5fcee190fdaeb50656c`"
    );
    await queryRunner.query(
      "ALTER TABLE `pos_shifts` DROP FOREIGN KEY `FK_b274a68b375a0a20c8532703bb4`"
    );
    await queryRunner.query(
      "ALTER TABLE `pos_shifts` DROP FOREIGN KEY `FK_0cbd91411b5e3d4414cf5c6c1c2`"
    );
    await queryRunner.query(
      "ALTER TABLE `pos_shifts` DROP FOREIGN KEY `FK_83bd8fc104a7823cbefc586ad84`"
    );
    await queryRunner.query(
      "ALTER TABLE `poses` DROP FOREIGN KEY `FK_07c46e07bd55564a095a6f64b33`"
    );
    await queryRunner.query(
      "ALTER TABLE `poses` DROP FOREIGN KEY `FK_91f3a0fc1b9c7e3743a7cb58c27`"
    );
    await queryRunner.query(
      "ALTER TABLE `poses` DROP FOREIGN KEY `FK_5e32362bbe271a6959c8a60bd8d`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `total` `total` decimal(10,2) NOT NULL COMMENT 'รวมทั้งหมด  = 1 ลบ 2 บวก 3 ลบ 4' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `withHoldingTax` `withHoldingTax` decimal(10,2) NOT NULL COMMENT '4 หัก ณ ที่จ่าย (คำนวนแล้ว)' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `withHoldingFactor` `withHoldingFactor` decimal(4,2) NOT NULL COMMENT 'หัก ณ ที่จ่าย (ตัวคูณ ถ้าหัก 3% ให้ใส่ 0.03)' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `vat` `vat` decimal(10,2) NOT NULL COMMENT '3 ภาษี' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `discount` `discount` decimal(10,2) NOT NULL COMMENT '2 ส่วนลด' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` CHANGE `subtotal` `subtotal` decimal(10,2) NOT NULL COMMENT '1 รวม' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `clientBranch`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `clientBranch` varchar(255) NOT NULL COMMENT 'ลูกค้า: สาขา' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `subtotal` `subtotal` decimal(10,2) NOT NULL COMMENT 'ยอดรวมรายการ' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `price` `price` decimal(10,2) NOT NULL COMMENT 'ราคาต่อหน่วย' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` CHANGE `quantity` `quantity` int NOT NULL COMMENT 'จำนวน' DEFAULT '0'"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP COLUMN `taxNumber`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD `taxNumber` bigint NULL"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `status`");
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `paidDate`");
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `paymentRefNo`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `paymentBankBranch`"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `paymentBank`");
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `changeAmount`"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `paidAmount`");
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `paymentMethod`"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `excludeVat`");
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `vatIncluded`");
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `discountFactor`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `clientTelephone`"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `clientType`");
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `POSVATCode`");
    await queryRunner.query(
      "ALTER TABLE `receipts` DROP COLUMN `organizationTaxNo`"
    );
    await queryRunner.query("ALTER TABLE `receipts` DROP COLUMN `posShiftId`");
    await queryRunner.query(
      "ALTER TABLE `receipt_items` DROP COLUMN `description3`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` DROP COLUMN `description2`"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` DROP COLUMN `description1`"
    );
    await queryRunner.query("ALTER TABLE `receipt_items` DROP COLUMN `ref4`");
    await queryRunner.query("ALTER TABLE `receipt_items` DROP COLUMN `ref3`");
    await queryRunner.query("ALTER TABLE `receipt_items` DROP COLUMN `ref2`");
    await queryRunner.query("ALTER TABLE `receipt_items` DROP COLUMN `ref1`");
    await queryRunner.query("ALTER TABLE `receipt_items` DROP COLUMN `refId`");
    await queryRunner.query(
      "ALTER TABLE `receipt_items` DROP COLUMN `refType`"
    );
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `posPinCode`");
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `organizationTaxNumber` varchar(16) NOT NULL COMMENT 'หมายเลขผู้เสียภาษีของหน่วยงาน' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `refType` varchar(16) NOT NULL COMMENT 'เอกสารอ้างอิงใบเสร็จ ใช้คู่กับ refId phase 1 รองรับแค่สัญญา  referencType: Agreement'"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `refId` int NOT NULL COMMENT 'เอกสารอ้างอิงใบเสร็จ ใช้คู่กับ refType phase 1 รองรับแค่สัญญา  refId = รหัสสัญญา '"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `createdByPosition` varchar(255) NOT NULL COMMENT 'ตำแหน่งผู้บรรทึก: ใช้ชื่อตำแหน่งของ creatorBy มา stamp ลงในใบเสร็จ' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `receipts` ADD `payerName` varchar(255) NOT NULL COMMENT 'ผู้ชำระเงิน' DEFAULT ''"
    );
    await queryRunner.query(
      "ALTER TABLE `receipt_items` ADD `description` varchar(512) NOT NULL COMMENT 'คำอธิบาย' DEFAULT ''"
    );
    await queryRunner.query("DROP TABLE `receipt_print_logs`");
    await queryRunner.query("DROP TABLE `pos_shift_logs`");
    await queryRunner.query("DROP TABLE `pos_shifts`");
    await queryRunner.query("DROP TABLE `poses`");
    await queryRunner.query(
      "ALTER TABLE `organizations` CHANGE `taxNumber` `receiptSequenceId` bigint NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD CONSTRAINT `FK_c6d17536c937899fe87119ff596` FOREIGN KEY (`receiptSequenceId`) REFERENCES `receipt_sequencies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
  }
}
