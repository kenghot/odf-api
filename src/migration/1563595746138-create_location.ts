import {MigrationInterface, QueryRunner} from "typeorm";

export class createLocation1563595746138 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `location_provinces` (`refCode` varchar(8) NOT NULL COMMENT 'รหัสจังหวัดจากกรมการปกครอง' DEFAULT '', `thName` varchar(128) NOT NULL DEFAULT '', `enName` varchar(128) NOT NULL DEFAULT '', PRIMARY KEY (`refCode`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `location_districts` (`refCode` varchar(8) NOT NULL COMMENT 'รหัสอำเภอจากกรมการปกครอง' DEFAULT '', `thName` varchar(128) NOT NULL DEFAULT '', `enName` varchar(128) NOT NULL DEFAULT '', `provinceCode` varchar(8) NULL COMMENT 'รหัสจังหวัดจากกรมการปกครอง', PRIMARY KEY (`refCode`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `location_sub_districts` (`refCode` varchar(8) NOT NULL COMMENT 'รหัสตำบลจากกรมการปกครอง' DEFAULT '', `thName` varchar(128) NOT NULL DEFAULT '', `enName` varchar(128) NOT NULL DEFAULT '', `zipcode` varchar(5) NOT NULL COMMENT 'รหัสไปรษณีย์' DEFAULT '', `latitude` varchar(16) NOT NULL COMMENT 'ละติจูด' DEFAULT '', `longitude` varchar(16) NOT NULL COMMENT 'ลองจิจูด' DEFAULT '', `districtCode` varchar(8) NULL COMMENT 'รหัสอำเภอจากกรมการปกครอง', `provinceCode` varchar(8) NULL COMMENT 'รหัสจังหวัดจากกรมการปกครอง', PRIMARY KEY (`refCode`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `location_districts` ADD CONSTRAINT `FK_a1c8c48e57169ab7876a7049427` FOREIGN KEY (`provinceCode`) REFERENCES `location_provinces`(`refCode`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `location_sub_districts` ADD CONSTRAINT `FK_3943a921747c401f67e496454f7` FOREIGN KEY (`districtCode`) REFERENCES `location_districts`(`refCode`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `location_sub_districts` ADD CONSTRAINT `FK_e35a0cf4ec14eae1a7633259ed8` FOREIGN KEY (`provinceCode`) REFERENCES `location_provinces`(`refCode`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `location_sub_districts` DROP FOREIGN KEY `FK_e35a0cf4ec14eae1a7633259ed8`");
        await queryRunner.query("ALTER TABLE `location_sub_districts` DROP FOREIGN KEY `FK_3943a921747c401f67e496454f7`");
        await queryRunner.query("ALTER TABLE `location_districts` DROP FOREIGN KEY `FK_a1c8c48e57169ab7876a7049427`");
        await queryRunner.query("DROP TABLE `location_sub_districts`");
        await queryRunner.query("DROP TABLE `location_districts`");
        await queryRunner.query("DROP TABLE `location_provinces`");
    }

}
