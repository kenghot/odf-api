import {
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository
} from "typeorm";
import { DebtCollectionVisit } from "../../entities/DebtCollectionVisit";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(DebtCollectionVisit)
class VisitRepository extends Repository<DebtCollectionVisit> {
  async createVisit(visit: DebtCollectionVisit) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(visit);
        await transactionEntityManager.save(visit.debtCollection);
      });
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(VisitRepository);
