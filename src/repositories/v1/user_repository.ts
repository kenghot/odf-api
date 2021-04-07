import {
  EntityRepository,
  getCustomRepository,
  getManager,
  In,
  Like,
  Repository
} from "typeorm";
import { IGetOptions } from "../../controllers/v1/base_controller";
import { AttachedFile } from "../../entities/AttachedFile";
import { Organization } from "../../entities/Organization";
import { Role } from "../../entities/Role";
import { User } from "../../entities/User";
import { DBError } from "../../middlewares/error/error-type";

interface IUserQuery {
  username?: string;
  firstname?: string;
  lastname?: string;
  organizationId?: number;
  permittedOrganizationIds?: number[];
  roleId?: number;
  active?: boolean;
  currentPage?: string;
  perPage?: string;
}

@EntityRepository(User)
class UserRepository extends Repository<User> {
  async findUsers(
    qs: IUserQuery,
    options: IGetOptions
  ): Promise<[User[], number]> {
    const { currentPage = 1, perPage = 10, ...searchConditions } = qs;
    const skip = (+currentPage - 1) * +perPage;
    try {
      let ids: number[];
      if (searchConditions.roleId) {
        ids = await this.getSubQuery({
          roleId: searchConditions.roleId
        });
      }

      const [records, total] = await this.findAndCount({
        select:
          options && options.selectedFields
            ? (options.selectedFields as any)
            : undefined,
        where: this.hasQuery(searchConditions)
          ? this.getWhereClause(searchConditions, ids)
          : undefined,
        relations: options && options.relations ? options.relations : undefined,
        skip,
        take: +perPage
      });
      return [records, total];
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async createUser(user: User): Promise<User> {
    try {
      await this.save(user, { listeners: false });

      return user;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateUser(
    user: User,
    roles: Role[],
    responsibilityOrganizations: Organization[],
    attachedFiles: AttachedFile[]
  ): Promise<User> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          if (roles || responsibilityOrganizations) {
            user.roles = roles ? [] : undefined;
            user.responsibilityOrganizations = responsibilityOrganizations
              ? []
              : undefined;

            await transactionEntityManager.save(user);

            user.roles = roles ? roles : undefined;
            user.responsibilityOrganizations = responsibilityOrganizations
              ? responsibilityOrganizations
              : undefined;
          }

          if (attachedFiles && attachedFiles.length > 0) {
            const ats = await transactionEntityManager.save(attachedFiles);
            // const ats = await transactionEntityManager.save(AttachedFile, [
            //   ...attachedFiles
            // ]);
            user.attachedFiles = ats;
          }

          await transactionEntityManager.save(user);
        } catch (e) {
          throw e;
        }
      });
      return user;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  private hasQuery(searchConditions: IUserQuery) {
    return Object.values(searchConditions).some((sc) => sc !== undefined);
  }

  private getWhereClause(qs: IUserQuery, ids?: number[]) {
    const where: any = {};

    where[qs.username && "username"] = Like(`%${qs.username}%`);
    where[qs.firstname && "firstname"] = Like(`%${qs.firstname}%`);
    where[qs.lastname && "lastname"] = Like(`%${qs.lastname}%`);
    where[qs.active && "active"] = qs.active;
    if (qs.permittedOrganizationIds && qs.permittedOrganizationIds.length > 0) {
      where.organizationId = In(qs.permittedOrganizationIds);
    }

    if (ids && ids.length > 0) {
      where.id = In(ids);
    }
    if (ids === null) {
      where.id = null;
    }

    delete where.undefined;

    return [where];
  }

  private async getSubQuery(qs: IUserQuery): Promise<number[]> {
    try {
      const users = await this.createQueryBuilder("user")
        .innerJoin("user.roles", "role", "role.id = :roleId", {
          roleId: qs.roleId
        })
        .getMany();

      if (users.length === 0) return null;

      const ids = users.map((user) => user.id);

      return ids;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(UserRepository);
