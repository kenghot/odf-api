import * as fs from "fs";
import * as yaml from "js-yaml";
import * as path from "path";
import { getManager, MigrationInterface, QueryRunner } from "typeorm";
const seedFiles = [
  { entity: "LocationProvince", data: "location_provinces.yml" },
  { entity: "LocationDistrict", data: "location_districts.yml" },
  { entity: "LocationSubDistrict", data: "location_sub_districts.yml" },
  { entity: "Occupation", data: "occupations.yml" },
  // { entity: "RequestSequence", data: "request_sequencies.yml" },
  // { entity: "AgreementSequence", data: "agreement_sequencies.yml" },
  // { entity: "GuaranteeSequence", data: "guarantee_sequencies.yml" },
  // { entity: "VoucherSequence", data: "voucher_sequencies.yml" },
  // { entity: "ReceiptSequence", data: "receipt_sequencies.yml" },
  { entity: "Role", data: "roles.yml" }
];
const seedFiles2 = [
  // { entity: "Organization", data: "organizations.yml" },
  { entity: "User", data: "users.yml" }
];

export class seedBaseData1563602486184 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        seedFiles.forEach((sf, index) => {
          const doc = yaml.safeLoad(
            fs.readFileSync(path.join(__dirname, `/data/${sf.data}`), "utf8")
          );
          seedFiles[index].data = doc;
        });
        for (const sf of seedFiles) {
          await transactionEntityManager
            .createQueryBuilder()
            .insert()
            .into(sf.entity)
            .values(sf.data)
            .execute();
        }

        seedFiles2.forEach((sf, index) => {
          const doc = yaml.safeLoad(
            fs.readFileSync(path.join(__dirname, `/data/${sf.data}`), "utf8")
          );
          seedFiles2[index].data = doc;
        });
        for (const sf of seedFiles2) {
          await transactionEntityManager.save(sf.entity, sf.data);
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
