import {
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository
} from "typeorm";
import { DebtCollectionLetter } from "../../entities/DebtCollectionLetter";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(DebtCollectionLetter)
class LetterRepository extends Repository<DebtCollectionLetter> {
  async createLetter(letter: DebtCollectionLetter) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(letter);
        await transactionEntityManager.save(letter.debtCollection);
      });
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(LetterRepository);
