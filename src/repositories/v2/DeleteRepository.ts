import { EntityManager, EntityRepository, getCustomRepository } from "typeorm";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository()
class DeleteRepository {
  constructor(private manager: EntityManager) {}

  async delete(entityClass: string, id: number) {
    try {
      const result = await this.manager.delete(entityClass, id);

      return result;
    } catch (err) {
      console.error(err);
      throw new DBError({ message: err.message });
    }
  }
}

export const deleteRepository = getCustomRepository(DeleteRepository);
