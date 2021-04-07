import { MigrationInterface, QueryRunner } from "typeorm";

export class modVoucher1586492064342 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `vouchers` ADD `fromAccountRef4` varchar(255) NOT NULL COMMENT 'เลขอ้างอิงการชำระ ดูวิธิการใช้ที่ fromAccountRef1' DEFAULT ''"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `vouchers` DROP COLUMN `fromAccountRef4`"
    );
  }
}
