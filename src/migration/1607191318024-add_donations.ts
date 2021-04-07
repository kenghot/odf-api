import { MigrationInterface, QueryRunner } from "typeorm";

export class addDonations1607191318024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "CREATE TABLE `donation_allowances` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `organizationId` bigint NOT NULL COMMENT 'หน่วยงานที่รับเงินบริจาค', `organization2` varchar(128) NOT NULL COMMENT 'หน่วยงานที่รับเรื่อง' DEFAULT '', `donationDate` date NULL COMMENT 'วันที่ประสงค์บริจาค', `receiptDate` date NULL COMMENT 'วันที่บริจาค', `receiptId` bigint NULL COMMENT 'รหัสใบเสร็จ', `posId` bigint NULL COMMENT 'รหัสจุดรับชำระ', `paidAmount` decimal(10,2) NOT NULL COMMENT 'จำนวนเงินที่ชำระ' DEFAULT 0, `donatorIdCardNo` varchar(13) NOT NULL COMMENT 'หมายเลขบัตรประชาชน' DEFAULT '', `donatorTitle` varchar(128) NOT NULL COMMENT 'คำนำหน้าชื่อ' DEFAULT '', `donatorFirstname` varchar(128) NOT NULL COMMENT 'ชื่อ' DEFAULT '', `donatorLastname` varchar(128) NOT NULL COMMENT 'นามสกุล' DEFAULT '', `donatorBirthDate` date NULL COMMENT 'วันเกิด >> หากไม่ทราบวันเกิดจะระบุเป็นวันที่  1/1/YYYY', `donatorIsOnlyBirthYear` tinyint NOT NULL COMMENT 'ไม่ทราบวันเกิด' DEFAULT 0, `donatorIdCardIssuer` varchar(128) NOT NULL COMMENT 'บัตรประชาชน ออกโดย' DEFAULT '', `donatorIdCardIssuedDate` date NULL COMMENT 'บัตรประชาชน ออกเมื่อ', `donatorIdCardExpireDate` date NULL COMMENT 'บัตรประชาชน วันหมดอายุ', `donatorIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่', `donatorIdCardAddressHouseNo` varchar(128) NOT NULL COMMENT 'เลขที่บ้าน' DEFAULT '', `donatorIdCardAddressBuildingName` varchar(128) NOT NULL COMMENT 'ชื่ออาคาร หมู่บ้าน' DEFAULT '', `donatorIdCardAddressRoomNo` varchar(128) NOT NULL COMMENT 'ห้อง' DEFAULT '', `donatorIdCardAddressFloor` varchar(128) NOT NULL COMMENT 'ชั้น' DEFAULT '', `donatorIdCardAddressHmoo` varchar(128) NOT NULL COMMENT 'หมู่ที่' DEFAULT '', `donatorIdCardAddressSoi` varchar(128) NOT NULL COMMENT 'ซอย' DEFAULT '', `donatorIdCardAddressStreet` varchar(128) NOT NULL COMMENT 'ถนน' DEFAULT '', `donatorIdCardAddressSubDistrictCode` varchar(8) NOT NULL COMMENT 'รหัสตำบล' DEFAULT '', `donatorIdCardAddressSubDistrict` varchar(128) NOT NULL COMMENT 'ตำบล' DEFAULT '', `donatorIdCardAddressDistrictCode` varchar(8) NOT NULL COMMENT 'รหัสอำเภอ' DEFAULT '', `donatorIdCardAddressDistrict` varchar(128) NOT NULL COMMENT 'อำเภอ' DEFAULT '', `donatorIdCardAddressProvinceCode` varchar(8) NOT NULL COMMENT 'รหัสจังหวัด' DEFAULT '', `donatorIdCardAddressProvince` varchar(128) NOT NULL COMMENT 'จังหวัด' DEFAULT '', `donatorIdCardAddressZipcode` varchar(8) NOT NULL COMMENT 'รหัสไปรษณีย์' DEFAULT '', `donatorIdCardAddressLatitude` varchar(128) NOT NULL COMMENT 'ละติจูด' DEFAULT '', `donatorIdCardAddressLongitude` varchar(128) NOT NULL COMMENT 'ลองจิจูด' DEFAULT '', `donatorDocumentDeliveryAddressHouseNo` varchar(128) NOT NULL COMMENT 'เลขที่บ้าน' DEFAULT '', `donatorDocumentDeliveryAddressBuildingName` varchar(128) NOT NULL COMMENT 'ชื่ออาคาร หมู่บ้าน' DEFAULT '', `donatorDocumentDeliveryAddressRoomNo` varchar(128) NOT NULL COMMENT 'ห้อง' DEFAULT '', `donatorDocumentDeliveryAddressFloor` varchar(128) NOT NULL COMMENT 'ชั้น' DEFAULT '', `donatorDocumentDeliveryAddressHmoo` varchar(128) NOT NULL COMMENT 'หมู่ที่' DEFAULT '', `donatorDocumentDeliveryAddressSoi` varchar(128) NOT NULL COMMENT 'ซอย' DEFAULT '', `donatorDocumentDeliveryAddressStreet` varchar(128) NOT NULL COMMENT 'ถนน' DEFAULT '', `donatorDocumentDeliveryAddressSubDistrictCode` varchar(8) NOT NULL COMMENT 'รหัสตำบล' DEFAULT '', `donatorDocumentDeliveryAddressSubDistrict` varchar(128) NOT NULL COMMENT 'ตำบล' DEFAULT '', `donatorDocumentDeliveryAddressDistrictCode` varchar(8) NOT NULL COMMENT 'รหัสอำเภอ' DEFAULT '', `donatorDocumentDeliveryAddressDistrict` varchar(128) NOT NULL COMMENT 'อำเภอ' DEFAULT '', `donatorDocumentDeliveryAddressProvinceCode` varchar(8) NOT NULL COMMENT 'รหัสจังหวัด' DEFAULT '', `donatorDocumentDeliveryAddressProvince` varchar(128) NOT NULL COMMENT 'จังหวัด' DEFAULT '', `donatorDocumentDeliveryAddressZipcode` varchar(8) NOT NULL COMMENT 'รหัสไปรษณีย์' DEFAULT '', `donatorDocumentDeliveryAddressLatitude` varchar(128) NOT NULL COMMENT 'ละติจูด' DEFAULT '', `donatorDocumentDeliveryAddressLongitude` varchar(128) NOT NULL COMMENT 'ลองจิจูด' DEFAULT '', PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `donation_directs` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `donationDate` date NULL COMMENT 'วันที่ประสงค์บริจาค', `receiptDate` date NULL COMMENT 'วันที่บริจาค', `receiptId` bigint NULL COMMENT 'รหัสใบเสร็จ', `name` varchar(255) NOT NULL COMMENT 'ชื่อโครงการ' DEFAULT '', `organizationId` bigint NOT NULL COMMENT 'หน่วยงานที่สร้างคำร้อง', `donatorName` text NULL COMMENT 'ชื่อผู้บริจาค', `donatorAddress` text NULL COMMENT 'ที่อยู่ผู้บริจาค', `note` text NULL COMMENT 'หมายเหตุ', PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` ADD CONSTRAINT `FK_85dfa3ddacc3ec9b7d9d7c21290` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` ADD CONSTRAINT `FK_c542ca53aceda4821580893e614` FOREIGN KEY (`receiptId`) REFERENCES `receipts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` ADD CONSTRAINT `FK_e9f02a06d4205431739b1472203` FOREIGN KEY (`posId`) REFERENCES `poses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` ADD CONSTRAINT `FK_18fc6225bde4f0fe08cda9d7146` FOREIGN KEY (`receiptId`) REFERENCES `receipts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` ADD CONSTRAINT `FK_f956469be794265cfc8c1125525` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `donation_directs` DROP FOREIGN KEY `FK_f956469be794265cfc8c1125525`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_directs` DROP FOREIGN KEY `FK_18fc6225bde4f0fe08cda9d7146`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` DROP FOREIGN KEY `FK_e9f02a06d4205431739b1472203`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` DROP FOREIGN KEY `FK_c542ca53aceda4821580893e614`"
    );
    await queryRunner.query(
      "ALTER TABLE `donation_allowances` DROP FOREIGN KEY `FK_85dfa3ddacc3ec9b7d9d7c21290`"
    );
    await queryRunner.query("DROP TABLE `donation_directs`");
    await queryRunner.query("DROP TABLE `donation_allowances`");
  }
}
