import {
  Brackets,
  EntityRepository,
  getCustomRepository,
  Repository
} from "typeorm";
import { User } from "../../entities/User";
import { DBError } from "../../middlewares/error/error-type";

@EntityRepository(User)
class UserRepository extends Repository<User> {
  async findPosAdminUsers(
    orgId: number,
    firstname?: string
  ): Promise<[User[], number]> {
    const queryBuilder = this.createQueryBuilder("user")
      .leftJoinAndSelect("user.organization", "organization")
      .leftJoinAndSelect(
        "user.responsibilityOrganizations",
        "responsibilityOrganization"
      );

    queryBuilder.where(
      new Brackets((qb) => {
        qb.where("organization.id = :orgId", {
          orgId
        }).orWhere("responsibilityOrganization.id = :orgId", { orgId });
      })
    );
    if (firstname) {
      queryBuilder.andWhere("user.firstname LIKE :firstname", {
        firstname: `%${firstname.trim()}%`
      });
    }
    queryBuilder.andWhere("user.active = true");

    try {
      const [users, total] = await queryBuilder.getManyAndCount();
      return [users, total];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(UserRepository);
