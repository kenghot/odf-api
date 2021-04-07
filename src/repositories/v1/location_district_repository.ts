import {
  EntityRepository,
  getCustomRepository,
  Like,
  Repository
} from "typeorm";

import { LocationDistrict } from "../../entities/LocationDistrict";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(LocationDistrict)
class LocationDistrictRepository extends Repository<LocationDistrict> {
  async findLocations(name: string) {
    try {
      const [locations, total] = await this.findAndCount({
        where: {
          thName: name ? Like(`%${name}%`) : Like("%%")
        },
        take: 20
      });

      return [locations, total];
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(LocationDistrictRepository);
