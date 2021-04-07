import { EntityRepository, getCustomRepository, Repository } from "typeorm";

import { AttachedFile } from "../../entities/AttachedFile";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(AttachedFile)
class AttachedFileRepository extends Repository<AttachedFile> {
  async findAttachedFiles(refId: number, refTypes: string[]) {
    const queryBuilder = this.createQueryBuilder("atf");
    queryBuilder.where("atf.refId = :refId AND atf.refType IN (:refTypes)", {
      refId,
      refTypes
    });

    try {
      const atfs = await queryBuilder.getMany();

      return atfs;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(AttachedFileRepository);
