import {
  EntityRepository,
  getCustomRepository,
  Like,
  Repository
} from "typeorm";
import { LocationSubDistrict } from "../../entities/LocationSubDistrict";
import { DBError } from "../../middlewares/error/error-type";
import { SearchConditionError } from "../../middlewares/error/error-type/SearchConditionError";

@EntityRepository(LocationSubDistrict)
class LocationSubDistrictRepository extends Repository<LocationSubDistrict> {
  async findLocations(name: string): Promise<[LocationSubDistrict[], number]> {
    try {
      const [locations, total] = await this.findAndCount({
        where: {
          thName: name ? Like(`%${name}%`) : Like(`%%`)
        },
        take: name ? 150 : 20
      });

      return [locations, total];
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  // async findLocationsWith(
  //     sub_district: string,
  //     district: string,
  //     province: string
  // ) {
  //     try {
  //         let province_ids: number[] = [];
  //         if (province) {
  //             const entities = await getRepository(LocationProvince).find({
  //                 select: ["id"],
  //                 where: [{ th_name: Like(`%${province}%`) }]
  //             });
  //             province_ids = entities.map(entity => entity.id);
  //         }

  //         let district_ids: number[] = [];
  //         if (district) {
  //             const entities = await getRepository(LocationDistrict).find({
  //                 select: ["id"],
  //                 where: [{ th_name: Like(`%${district}%`) }]
  //             });
  //             district_ids = entities.map(entity => entity.id);
  //         }

  //         const [locations, total] = await this.findAndCount({
  //             where: {
  //                 th_name: sub_district
  //                     ? Like(`%${sub_district}%`)
  //                     : Like(`%%`),
  //                 district:
  //                     district_ids.length > 0 ? In(district_ids) : Like(`%%`),
  //                 province:
  //                     province_ids.length > 0 ? In(province_ids) : Like(`%%`)
  //             }
  //         });
  //         if (!total) {
  //             throw new SearchConditionError("cannot find this location");
  //         }

  //         return locations;
  //     } catch (e) {
  //         throw e;
  //     }
  // }
}

export default getCustomRepository(LocationSubDistrictRepository);
