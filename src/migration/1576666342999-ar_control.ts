import { MigrationInterface, QueryRunner } from "typeorm";

export class arControl1576666342999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `totalPaidAmount`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `sourceARDocumentNumber` varchar(48) NOT NULL COMMENT 'เลขที่บัญชี' COMMENT 'เลขที่บัญชี' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `sourceARInstallmentFirstDate` date NULL COMMENT 'ผ่อนชำระงวดแรกวันที่' COMMENT 'ผ่อนชำระงวดแรกวันที่' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `sourceARInstallmentLastDate` date NULL COMMENT 'ผ่อนชำระงวดสุดท้ายให้เสร็จสิ้นภายในวันที่' COMMENT 'ผ่อนชำระงวดสุดท้ายให้เสร็จสิ้นภายในวันที่' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `sourceARInstallmentAmount` decimal(10,2) NOT NULL COMMENT 'จำนวนเงินชำระต่องวด' DEFAULT 0 COMMENT 'จำนวนเงินชำระต่องวด' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `sourceARLoanAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินกู้' DEFAULT 0 COMMENT 'ยอดเงินกู้' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `sourceARTTotalPaidAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินที่ชำระแล้วทั้งหมด' DEFAULT 0 COMMENT 'ยอดเงินที่ชำระแล้วทั้งหมด' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `sourceARTLastPaidDate` date NULL COMMENT 'วันที่ชำระครั้งล่าสุด' COMMENT 'วันที่ชำระครั้งล่าสุด' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `expectedLastPaidDate` date NULL COMMENT 'จำนวนวันที่ควรชำระงวดล่าสุด' COMMENT 'จำนวนวันที่ควรชำระงวดล่าสุด' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `expectedPaidTimes` int NOT NULL COMMENT 'จำนวนงวดที่ต้องจ่าย  ณ วันที่รัน script' DEFAULT 0 COMMENT 'จำนวนงวดที่ต้องจ่าย  ณ วันที่รัน script' "
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `overDueDay` int NOT NULL COMMENT 'จำนวนวันที่เลยกำหนดชำระ' DEFAULT 0 COMMENT 'จำนวนวันที่เลยกำหนดชำระ' "
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `overDueDay`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `expectedPaidTimes`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `expectedLastPaidDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `sourceARTLastPaidDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `sourceARTTotalPaidAmount`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `sourceARLoanAmount`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `sourceARInstallmentAmount`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `sourceARInstallmentLastDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `sourceARInstallmentFirstDate`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` DROP COLUMN `sourceARDocumentNumber`"
    );
    await queryRunner.query(
      "ALTER TABLE `account_receivable_controls` ADD `totalPaidAmount` decimal(10,2) NOT NULL COMMENT 'ยอดเงินที่ชำระแล้วทั้งหมด' DEFAULT '0.00'"
    );
  }
}
