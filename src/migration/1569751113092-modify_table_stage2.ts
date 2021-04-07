import { MigrationInterface, QueryRunner } from "typeorm";

export class modifyTableStage21569751113092 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `guarantees` DROP FOREIGN KEY `FK_992efe5440bdb8c11710d4a9500`"
    );
    await queryRunner.query(
      "DROP INDEX `REL_992efe5440bdb8c11710d4a950` ON `guarantees`"
    );
    await queryRunner.query(
      "CREATE INDEX `REL_992efe5440bdb8c11710d4a950` ON `guarantees` (`requestId`)"
    );
    await queryRunner.query(
      "ALTER TABLE `attached_files` MODIFY `refId` bigint NULL"
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` MODIFY `refId` bigint NOT NULL COMMENT 'เอกสารอ้างอิงการจ่าย ใช้คู่กับ refType ' COMMENT 'เอกสารอ้างอิงการจ่าย ใช้คู่กับ refType ' "
    );
    await queryRunner.query(
      "DROP INDEX `IDX_19a3005f0f5aaa83a15cd63b65` ON `guarantees`"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `guarantorRegisteredAddressType` `guarantorRegisteredAddressType` int NOT NULL COMMENT 'รูปแบบที่อยู่ตามทะเบียนบ้าน  ข้อมูลที่อยู่ตามทะเบียนบ้าน จะมีค่าเมื่อ registeredAddressType = 2 asIdCard = 0, asRegistered = 1, other = 99,' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `agreement_items` CHANGE `borrowerIdCardLifetime` `borrowerIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `agreement_items` CHANGE `guarantorIdCardLifetime` `guarantorIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `guarantorIdCardLifetime` `guarantorIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `borrowerIdCardLifetime` `borrowerIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `agreement_items` CHANGE `borrowerAge` `borrowerAge` int NOT NULL COMMENT 'อายุ' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `agreement_items` CHANGE `guarantorAge` `guarantorAge` int NOT NULL COMMENT 'อายุ' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `guarantorAge` `guarantorAge` int NOT NULL COMMENT 'อายุ' DEFAULT 0"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `borrowerAge` `borrowerAge` int NOT NULL COMMENT 'อายุ' DEFAULT 0"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `borrowerAge` `borrowerAge` int NOT NULL COMMENT 'อายุ'"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `guarantorAge` `guarantorAge` int NOT NULL COMMENT 'อายุ'"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `guarantorSalary` `guarantorSalary` decimal(10,2) NOT NULL COMMENT 'เงินเดือนผู้ค้ำ' DEFAULT '0.00'"
    );
    await queryRunner.query(
      "ALTER TABLE `agreement_items` CHANGE `guarantorAge` `guarantorAge` int NOT NULL COMMENT 'อายุ'"
    );
    await queryRunner.query(
      "ALTER TABLE `agreement_items` CHANGE `borrowerAge` `borrowerAge` int NOT NULL COMMENT 'อายุ'"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `borrowerIdCardLifetime` `borrowerIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่'"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `guarantorIdCardLifetime` `guarantorIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่'"
    );
    await queryRunner.query(
      "ALTER TABLE `agreement_items` CHANGE `guarantorIdCardLifetime` `guarantorIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่'"
    );
    await queryRunner.query(
      "ALTER TABLE `agreement_items` CHANGE `borrowerIdCardLifetime` `borrowerIdCardLifetime` tinyint NOT NULL COMMENT 'เป็นบัตรประชาชน บัตรตลอดชีพหรือไม่'"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantee_items` CHANGE `guarantorRegisteredAddressType` `guarantorRegisteredAddressType` int NOT NULL COMMENT 'รูปแบบที่อยู่ตามทะเบียนบ้าน  ข้อมูลที่อยู่ตามทะเบียนบ้าน จะมีค่าเมื่อ registeredAddressType = 2 asIdCard = 0, asRegistered = 1, other = 99,'"
    );
    await queryRunner.query(
      "CREATE UNIQUE INDEX `IDX_19a3005f0f5aaa83a15cd63b65` ON `guarantees` (`documentNumber`)"
    );
    await queryRunner.query(
      "ALTER TABLE `vouchers` MODIFY `refId` int NOT NULL COMMENT 'เอกสารอ้างอิงการจ่าย ใช้คู่กับ refType '"
    );
    await queryRunner.query(
      "ALTER TABLE `attached_files` MODIFY `refId` int NULL"
    );
    await queryRunner.query(
      "DROP INDEX `REL_992efe5440bdb8c11710d4a950` ON `guarantees`"
    );
    await queryRunner.query(
      "CREATE UNIQUE INDEX `REL_992efe5440bdb8c11710d4a950` ON `guarantees` (`requestId`)"
    );
    await queryRunner.query(
      "ALTER TABLE `guarantees` ADD CONSTRAINT `FK_992efe5440bdb8c11710d4a9500` FOREIGN KEY (`requestId`) REFERENCES `requests`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION"
    );
  }
}
