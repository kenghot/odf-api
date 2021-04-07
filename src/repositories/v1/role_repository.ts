import {
  DeepPartial,
  EntityRepository,
  getCustomRepository,
  getManager,
  Repository
} from "typeorm";
import { Role } from "../../entities/Role";
import { DBError, NotFoundError } from "../../middlewares/error/error-type";

@EntityRepository(Role)
class RoleRepository extends Repository<Role> {
  async findRole(id: number) {
    try {
      const role = await this.findOne({
        select: ["id", "name", "description", "permissions"],
        where: { id }
      });

      if (!role) {
        throw new NotFoundError({
          name: "ไม่พบกลุ่มผู้ใช้งานที่เลือก",
          message: "ไม่พบกลุ่มผู้ใช้งานที่เลือก"
        });
      }

      return role;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateRole(role: Role): Promise<Role> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          await transactionEntityManager.save(role);
        } catch (e) {
          throw e;
        }
      });

      return role;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(RoleRepository);
