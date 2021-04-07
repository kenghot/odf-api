import {
  EntityRepository,
  getCustomRepository,
  Like,
  Repository
} from "typeorm";

import { LocationProvince } from "../../entities/LocationProvince";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(LocationProvince)
class LocationProvinceRepository extends Repository<LocationProvince> {
  async findLocations(
    name: string,
    sorting?: boolean
  ): Promise<[LocationProvince[], number]> {
    try {
      const [locations, total] = await this.findAndCount({
        where: {
          thName: name ? Like(`%${name}%`) : Like("%%")
        },
        order: sorting ? { thName: "ASC" } : undefined,
        take: 20
      });

      return [locations, total];
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(LocationProvinceRepository);
