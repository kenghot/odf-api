import {
  EntityRepository,
  getCustomRepository,
  In,
  Like,
  Repository
} from "typeorm";

import { Organization } from "../../entities/Organization";
import { DBError } from "../../middlewares/error/error-type";

interface IOrganizationQuery {
  orgName?: string;
  provinceCode?: string;
  parentId?: string;
  permittedOrganizationIds?: number[];
  active?: boolean;
  orgCode?: string;
  currentPage?: string;
  perPage?: string;
}

@EntityRepository(Organization)
class OrganizationRepository extends Repository<Organization> {
  async findOrganizations(
    qs: IOrganizationQuery,
    relations?: string[]
  ): Promise<[Organization[], number]> {
    const { currentPage = 1, perPage = 10, ...searchConditions } = qs;
    const skip = (+currentPage - 1) * +perPage;
    try {
      const [records, total] = await this.findAndCount({
        where: this.hasQuery(searchConditions)
          ? this.getWhereClause(searchConditions)
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

  private hasQuery(searchConditions: IOrganizationQuery) {
    return Object.values(searchConditions).some((sc) => sc !== undefined);
  }

  private getWhereClause(qs: IOrganizationQuery) {
    const where: any = {};
    where[qs.orgName && "orgName"] = Like(`%${qs.orgName}%`);
    where[qs.provinceCode && "address"] = { provinceCode: qs.provinceCode };
    where[qs.parentId && "parent"] = qs.parentId;
    where[qs.active && "active"] = qs.active;
    where[qs.orgCode && "orgCode"] = qs.orgCode;

    if (qs.permittedOrganizationIds && qs.permittedOrganizationIds.length > 0) {
      where.id = In(qs.permittedOrganizationIds);
    }

    delete where.undefined;

    return [where];
  }
}

export default getCustomRepository(OrganizationRepository);
