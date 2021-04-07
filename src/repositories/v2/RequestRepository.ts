import {
  EntityRepository,
  getCustomRepository,
  getManager,
  getRepository,
  Repository
} from "typeorm";

import { Request } from "../../entities/Request";
import { DBError } from "../../middlewares/error/error-type";
import { IUpdateOptions } from "./UpdateRepository";

@EntityRepository(Request)
class RequestRepository extends Repository<Request> {
  async updateRequest(
    entity: any,
    sequenceEntityClass: string,
    sequenceEntity: any,
    options: IUpdateOptions = {}
  ) {
    const { o2ms = [], m2ms = [] } = options;

    try {
      await getManager().transaction(async (transactionEntityManager) => {
        const updateResult = await transactionEntityManager
          .createQueryBuilder()
          .update(sequenceEntityClass)
          .set({ sequenceNumber: () => "sequenceNumber + 1" })
          .whereEntity(sequenceEntity)
          .execute();

        const updatedSequence: any = await transactionEntityManager.findOne(
          sequenceEntityClass,
          {
            id: sequenceEntity.id,
            updatedDate: updateResult.generatedMaps[0].updatedDate
          }
        );

        entity.documentNumber = updatedSequence.runningNumber;

        // update O2M
        for (const o2m of o2ms) {
          await transactionEntityManager.remove(
            o2m.entityClass,
            entity[o2m.entityField]
          );
          entity[o2m.entityField] = getRepository(o2m.entityClass).create(
            o2m.value
          );
        }
        // update M2M
        for (const m2m of m2ms) {
          entity[m2m.entityField] = m2m.value ? [] : undefined;

          await transactionEntityManager.save(entity);

          entity[m2m.entityField] = m2m.value ? m2m.value : undefined;
        }

        const record = await transactionEntityManager.save(entity);

        return record;
      });
    } catch (err) {
      console.error(err);
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(RequestRepository);
