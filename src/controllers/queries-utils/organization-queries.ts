import { SelectQueryBuilder } from "typeorm";

// ภาค precondition :: leftJoin("requests.organization", "organization")
export const addSelectRegion = (queryBuilder: SelectQueryBuilder<any>) => {
  return queryBuilder.addSelect(
    `CASE  organization.region
      WHEN "N" THEN "เหนือ"
      WHEN "S" THEN "ใต้"
      WHEN "C" THEN "กลาง"
      WHEN "W" THEN "ตะวันตก"
      WHEN "E" THEN "ตะวันออก"
      WHEN "NE" THEN "ตะวันออกเฉียงเหนือ"
      ELSE  "-" END`,
    "region"
  );
};
