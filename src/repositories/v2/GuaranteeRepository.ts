import {
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository
} from "typeorm";

import { Agreement } from "../../entities/Agreement";
import { Guarantee } from "../../entities/Guarantee";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(Guarantee)
class GuaranteeRepository extends Repository<Guarantee> {
  async createGuaranteeAndMapToAgreement(
    oldGuarantee: Guarantee,
    agreement: Agreement
  ): Promise<Guarantee> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          await transactionEntityManager.save(oldGuarantee);
          await transactionEntityManager.save(agreement);
        } catch (e) {
          throw e;
        }
      });

      return agreement.guarantee;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async updateGuarantee(guarantee: Guarantee) {
    try {
      guarantee.setName();
      guarantee.setAge();
      await this.save(guarantee);
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(GuaranteeRepository);
