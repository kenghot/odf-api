import {
  EntityRepository,
  getCustomRepository,
  Like,
  Repository
} from "typeorm";

import { ISequenceQuery } from "../../controllers/v1/sequence_controller";
import { RequestSequence } from "../../entities/RequestSequence";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(RequestSequence)
class RequestOnlineSequenceRepository extends Repository<RequestSequence> {
  async findSequencies(
    qs: ISequenceQuery,
    relations?: string[]
  ): Promise<[RequestSequence[], number]> {
    const { currentPage = 1, perPage = 10, ...searchConditions } = qs;
    const skip = (+currentPage - 1) * +perPage;
    try {
      const [records, total] = await this.findAndCount({
        where: this.hasQuery(searchConditions)
          ? this.getSearchConditions(searchConditions)
          : undefined,
        relations: relations ? relations : undefined,
        skip,
        take: +perPage
      });
      return [records, total];
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  private hasQuery(searchConditions: ISequenceQuery) {
    return Object.values(searchConditions).some((sc) => sc !== undefined);
  }

  private getSearchConditions(qs: ISequenceQuery) {
    return [
      {
        prefixCode: qs.prefixCode ? Like(`%${qs.prefixCode}%`) : Like("%%"),
        prefixYear: qs.prefixYear ? Like(`%${qs.prefixYear}%`) : Like("%%")
      }
    ];
  }
}

export default getCustomRepository(RequestOnlineSequenceRepository);
