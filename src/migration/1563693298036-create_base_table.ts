import { MigrationInterface, QueryRunner } from "typeorm";

export class createBaseTable1563693298036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "CREATE TABLE `agreement_sequencies` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `sequenceNumber` int NOT NULL DEFAULT 0, `paddingSize` int NOT NULL DEFAULT 4, `paddingChar` varchar(1) NOT NULL DEFAULT '0', `prefixCode` varchar(8) NOT NULL, `prefixYear` varchar(8) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `guarantee_sequencies` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `sequenceNumber` int NOT NULL DEFAULT 0, `paddingSize` int NOT NULL DEFAULT 4, `paddingChar` varchar(1) NOT NULL DEFAULT '0', `prefixCode` varchar(8) NOT NULL, `prefixYear` varchar(8) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `receipt_sequencies` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `sequenceNumber` int NOT NULL DEFAULT 0, `paddingSize` int NOT NULL DEFAULT 4, `paddingChar` varchar(1) NOT NULL DEFAULT '0', `prefixCode` varchar(8) NOT NULL, `prefixYear` varchar(8) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `request_sequencies` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `sequenceNumber` int NOT NULL DEFAULT 0, `paddingSize` int NOT NULL DEFAULT 4, `paddingChar` varchar(1) NOT NULL DEFAULT '0', `prefixCode` varchar(8) NOT NULL, `prefixYear` varchar(8) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `voucher_sequencies` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `sequenceNumber` int NOT NULL DEFAULT 0, `paddingSize` int NOT NULL DEFAULT 4, `paddingChar` varchar(1) NOT NULL DEFAULT '0', `prefixCode` varchar(8) NOT NULL, `prefixYear` varchar(8) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `organizations` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `orgName` varchar(255) NOT NULL COMMENT 'ชื่อหน่วยงาน' DEFAULT '', `orgCode` varchar(8) NOT NULL COMMENT 'รหัสหน่วยงาน' DEFAULT '', `refReportCode` varchar(8) NOT NULL COMMENT 'รหัสอ้างอิงสำหรับออกรายงาน นี้จะใช้เป็น default ในการ stamp ค่า refReportCode ตามเอกสารต่างๆ ' DEFAULT '', `agreementAuthorizedTitle` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนาม คำนำหน้าชื่อ' DEFAULT '', `agreementAuthorizedFirstname` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนาม ชื่อ' DEFAULT '', `agreementAuthorizedLastname` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนาม นามสกุล' DEFAULT '', `agreementAuthorizedPosition` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนาม ตำแหน่ง' DEFAULT '', `agreementAuthorizedCommandNo` varchar(128) NOT NULL COMMENT 'ผู้มีสิทธิ์ลงนามจากคำสั่งเลขที่' DEFAULT '', `agreementAuthorizedCommandDate` date NULL COMMENT 'ผู้มีสิทธิ์ลงนามจากคำสั่งเมื่อวันที่', `witness1` varchar(255) NOT NULL COMMENT 'พยานคนที่1' DEFAULT '', `witness2` varchar(255) NOT NULL COMMENT 'พยานคนที่2' DEFAULT '', `active` tinyint NOT NULL COMMENT 'สถานะเปิด/ปิดการใช้งาน' DEFAULT 0, `telephone` varchar(64) NOT NULL COMMENT 'หมายเลขโทรศัพท์' DEFAULT '', `requestSequenceId` bigint NULL, `agreementSequenceId` bigint NULL, `guaranteeSequenceId` bigint NULL, `voucherSequenceId` bigint NULL, `receiptSequenceId` bigint NULL, `parentId` bigint NULL, `addressHouseNo` varchar(128) NOT NULL COMMENT 'เลขที่บ้าน' DEFAULT '', `addressBuildingName` varchar(128) NOT NULL COMMENT 'ชื่ออาคาร หมู่บ้าน' DEFAULT '', `addressRoomNo` varchar(128) NOT NULL COMMENT 'ห้อง' DEFAULT '', `addressFloor` varchar(128) NOT NULL COMMENT 'ชั้น' DEFAULT '', `addressHmoo` varchar(128) NOT NULL COMMENT 'หมู่ที่' DEFAULT '', `addressSoi` varchar(128) NOT NULL COMMENT 'ซอย' DEFAULT '', `addressStreet` varchar(128) NOT NULL COMMENT 'ถนน' DEFAULT '', `addressSubDistrictCode` varchar(8) NOT NULL COMMENT 'รหัสตำบล' DEFAULT '', `addressSubDistrict` varchar(128) NOT NULL COMMENT 'ตำบล' DEFAULT '', `addressDistrictCode` varchar(8) NOT NULL COMMENT 'รหัสอำเภอ' DEFAULT '', `addressDistrict` varchar(128) NOT NULL COMMENT 'อำเภอ' DEFAULT '', `addressProvinceCode` varchar(8) NOT NULL COMMENT 'รหัสจังหวัด' DEFAULT '', `addressProvince` varchar(128) NOT NULL COMMENT 'จังหวัด' DEFAULT '', `addressZipcode` varchar(8) NOT NULL COMMENT 'รหัสไปรษณีย์' DEFAULT '', `addressLatitude` varchar(128) NOT NULL COMMENT 'ละติจูด' DEFAULT '', `addressLongitude` varchar(128) NOT NULL COMMENT 'ลองจิจูด' DEFAULT '', PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `attached_files` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `refId` int NULL, `refType` varchar(255) NULL, `documentCode` varchar(255) NULL COMMENT 'รหัสเอกสาร', `documentName` varchar(255) NULL COMMENT 'ชื่อเอกสาร', `isVerified` varchar(4) NULL COMMENT 'ผ่านการตรวจสอบ', `verfiedBy` varchar(255) NULL COMMENT 'ตรวจสอบเอกสารโดย', `isSend` varchar(4) NULL, `documentDescription` varchar(255) NOT NULL COMMENT 'รายละเอียดเอกสารแนบ' DEFAULT '', `fileFieldname` varchar(255) NULL, `fileOriginalname` varchar(255) NULL, `fileEncoding` varchar(255) NULL, `fileMimetype` varchar(255) NULL, `fileSize` int NULL, `fileDestination` varchar(255) NULL, `fileFilename` varchar(255) NULL, `filePath` varchar(255) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `blacklists` (`uid` varchar(16) NOT NULL, `clientId` varchar(64) NOT NULL, PRIMARY KEY (`uid`, `clientId`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `occupations` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `name` varchar(128) NOT NULL COMMENT 'ชื่ออาชีพ' DEFAULT '', `occupationType` int NOT NULL COMMENT 'ประเภทอาชีพ borrower = 0, guarantor = 1, request = 2,', `active` tinyint NOT NULL COMMENT 'สถานะเปิด/ปิดการใช้งาน' DEFAULT 0, PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `refresh_token` (`refreshToken` varchar(255) NOT NULL, `uid` varchar(16) NOT NULL, `clientId` varchar(64) NOT NULL, PRIMARY KEY (`refreshToken`, `uid`, `clientId`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `roles` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `name` varchar(128) NOT NULL, `description` varchar(255) NOT NULL DEFAULT '', `permissions` text NULL, UNIQUE INDEX `IDX_648e3f5447f725579d7d4ffdfb` (`name`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `users` (`id` bigint NOT NULL AUTO_INCREMENT, `createdDate` datetime(6) NULL COMMENT 'วันที่สร้าง' DEFAULT CURRENT_TIMESTAMP(6), `updatedDate` datetime(6) NULL COMMENT 'วันที่ปรับปรุง' DEFAULT CURRENT_TIMESTAMP(6), `createdBy` int NULL COMMENT 'รหัสผู้ใช้ที่สร้าง', `createdByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่สร้าง' DEFAULT '', `updatedBy` int NULL COMMENT 'รหัสผู้ใช้ที่ปรับปรุงล่าสุด', `updatedByName` varchar(255) NOT NULL COMMENT 'ชื่อผู้ใช้ที่ปรับปรุงล่าสุด' DEFAULT '', `username` varchar(128) NOT NULL, `email` varchar(128) NOT NULL, `password` varchar(255) NULL, `resetPasswordToken` varchar(8) NOT NULL DEFAULT '', `resetPasswordTokenExpiration` bigint NOT NULL DEFAULT -1, `firstname` varchar(128) NOT NULL DEFAULT '', `lastname` varchar(128) NOT NULL DEFAULT '', `telephone` varchar(64) NOT NULL DEFAULT '', `signinCount` int NOT NULL DEFAULT 0, `lastSigninDate` date NULL, `lastSigninIp` varchar(64) NOT NULL DEFAULT '', `registrationAgreement` tinyint NOT NULL DEFAULT 0, `title` varchar(128) NOT NULL DEFAULT '', `active` tinyint NOT NULL DEFAULT 0, `position` varchar(128) NOT NULL DEFAULT '', `organizationId` bigint NULL, UNIQUE INDEX `IDX_fe0bb3f6520ee0469504521e71` (`username`), PRIMARY KEY (`id`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `users_roles_roles` (`usersId` bigint NOT NULL, `rolesId` bigint NOT NULL, INDEX `IDX_df951a64f09865171d2d7a502b` (`usersId`), INDEX `IDX_b2f0366aa9349789527e0c36d9` (`rolesId`), PRIMARY KEY (`usersId`, `rolesId`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "CREATE TABLE `users_responsibility_organizations_organizations` (`usersId` bigint NOT NULL, `organizationsId` bigint NOT NULL, INDEX `IDX_4380c6812a99612a637ef5d42e` (`usersId`), INDEX `IDX_04bacd44181d98c0d9032946ba` (`organizationsId`), PRIMARY KEY (`usersId`, `organizationsId`)) ENGINE=InnoDB"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD CONSTRAINT `FK_fbc18c044fb9a650fa2cec5b190` FOREIGN KEY (`requestSequenceId`) REFERENCES `request_sequencies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD CONSTRAINT `FK_6bbf2567538394a868c03cd9ba9` FOREIGN KEY (`agreementSequenceId`) REFERENCES `agreement_sequencies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD CONSTRAINT `FK_acf2318f96adf288e60bf8de3ea` FOREIGN KEY (`guaranteeSequenceId`) REFERENCES `guarantee_sequencies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD CONSTRAINT `FK_b55a6b9e61ebb4a78510c080ed2` FOREIGN KEY (`voucherSequenceId`) REFERENCES `voucher_sequencies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD CONSTRAINT `FK_c6d17536c937899fe87119ff596` FOREIGN KEY (`receiptSequenceId`) REFERENCES `receipt_sequencies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` ADD CONSTRAINT `FK_b9e8b8e8d88eed668c3e6e69d3c` FOREIGN KEY (`parentId`) REFERENCES `organizations`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `users` ADD CONSTRAINT `FK_f3d6aea8fcca58182b2e80ce979` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `users_roles_roles` ADD CONSTRAINT `FK_df951a64f09865171d2d7a502b1` FOREIGN KEY (`usersId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `users_roles_roles` ADD CONSTRAINT `FK_b2f0366aa9349789527e0c36d97` FOREIGN KEY (`rolesId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `users_responsibility_organizations_organizations` ADD CONSTRAINT `FK_4380c6812a99612a637ef5d42e1` FOREIGN KEY (`usersId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
    await queryRunner.query(
      "ALTER TABLE `users_responsibility_organizations_organizations` ADD CONSTRAINT `FK_04bacd44181d98c0d9032946ba7` FOREIGN KEY (`organizationsId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `users_responsibility_organizations_organizations` DROP FOREIGN KEY `FK_04bacd44181d98c0d9032946ba7`"
    );
    await queryRunner.query(
      "ALTER TABLE `users_responsibility_organizations_organizations` DROP FOREIGN KEY `FK_4380c6812a99612a637ef5d42e1`"
    );
    await queryRunner.query(
      "ALTER TABLE `users_roles_roles` DROP FOREIGN KEY `FK_b2f0366aa9349789527e0c36d97`"
    );
    await queryRunner.query(
      "ALTER TABLE `users_roles_roles` DROP FOREIGN KEY `FK_df951a64f09865171d2d7a502b1`"
    );
    await queryRunner.query(
      "ALTER TABLE `users` DROP FOREIGN KEY `FK_f3d6aea8fcca58182b2e80ce979`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP FOREIGN KEY `FK_b9e8b8e8d88eed668c3e6e69d3c`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP FOREIGN KEY `FK_c6d17536c937899fe87119ff596`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP FOREIGN KEY `FK_b55a6b9e61ebb4a78510c080ed2`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP FOREIGN KEY `FK_acf2318f96adf288e60bf8de3ea`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP FOREIGN KEY `FK_6bbf2567538394a868c03cd9ba9`"
    );
    await queryRunner.query(
      "ALTER TABLE `organizations` DROP FOREIGN KEY `FK_fbc18c044fb9a650fa2cec5b190`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_04bacd44181d98c0d9032946ba` ON `users_responsibility_organizations_organizations`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_4380c6812a99612a637ef5d42e` ON `users_responsibility_organizations_organizations`"
    );
    await queryRunner.query(
      "DROP TABLE `users_responsibility_organizations_organizations`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_b2f0366aa9349789527e0c36d9` ON `users_roles_roles`"
    );
    await queryRunner.query(
      "DROP INDEX `IDX_df951a64f09865171d2d7a502b` ON `users_roles_roles`"
    );
    await queryRunner.query("DROP TABLE `users_roles_roles`");
    await queryRunner.query(
      "DROP INDEX `IDX_fe0bb3f6520ee0469504521e71` ON `users`"
    );
    await queryRunner.query("DROP TABLE `users`");
    await queryRunner.query(
      "DROP INDEX `IDX_648e3f5447f725579d7d4ffdfb` ON `roles`"
    );
    await queryRunner.query("DROP TABLE `roles`");
    await queryRunner.query("DROP TABLE `refresh_token`");
    await queryRunner.query("DROP TABLE `occupations`");
    await queryRunner.query("DROP TABLE `blacklists`");
    await queryRunner.query("DROP TABLE `attached_files`");
    await queryRunner.query("DROP TABLE `organizations`");
    await queryRunner.query("DROP TABLE `voucher_sequencies`");
    await queryRunner.query("DROP TABLE `request_sequencies`");
    await queryRunner.query("DROP TABLE `receipt_sequencies`");
    await queryRunner.query("DROP TABLE `guarantee_sequencies`");
    await queryRunner.query("DROP TABLE `agreement_sequencies`");
  }
}
