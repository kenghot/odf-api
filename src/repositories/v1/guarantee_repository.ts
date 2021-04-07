import {
  Between,
  EntityRepository,
  getCustomRepository,
  getManager,
  getRepository,
  In,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository
} from "typeorm";

import { GuaranteeSequenceRepository } from ".";
import { IGetOptions } from "../../controllers/v1/base_controller";
import { Agreement } from "../../entities/Agreement";
import { Guarantee } from "../../entities/Guarantee";
import { GuaranteeItem } from "../../entities/GuaranteeItem";
import { GuaranteeSequence } from "../../entities/GuaranteeSequence";
import { RequestItem } from "../../entities/RequestItem";
import { loanTypeSet } from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";

export interface IGuaranteeQuery {
  documentNumber?: string;
  organizationId?: number;
  guaranteeType?: loanTypeSet;
  firstname?: string;
  lastname?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  idCardNo?: string;
  status?: number;
  fiscalYear?: string;
  permittedOrganizationIds?: number[];
  currentPage?: string;
  perPage?: string;
}
@EntityRepository(Guarantee)
class GuaranteeRepository extends Repository<Guarantee> {
  async findGuarantees(
    qs: IGuaranteeQuery,
    options: IGetOptions
  ): Promise<[Guarantee[], number]> {
    const { currentPage = 1, perPage = 10, ...searchConditions } = qs;
    const { firstname, lastname, idCardNo } = searchConditions;
    const skip = (+currentPage - 1) * +perPage;
    try {
      let subIds: number[] = [];
      if (this.hasQuery({ firstname, lastname, idCardNo })) {
        subIds = await this.getSubQuery({
          firstname,
          lastname,
          idCardNo
        });
      }

      const [records, total] = await this.findAndCount({
        select:
          options && options.selectedFields
            ? (options.selectedFields as any)
            : undefined,
        where: this.hasQuery(searchConditions)
          ? this.getWhereClause(searchConditions, subIds)
          : undefined,
        relations: options && options.relations ? options.relations : undefined,
        order: { documentDate: "DESC", documentNumber: "DESC" },
        skip,
        take: +perPage
      });
      return [records, total];
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async createGuarantee(guarantee: Guarantee): Promise<Guarantee> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          await transactionEntityManager.save(guarantee);
        } catch (e) {
          throw e;
        }
      });

      return guarantee;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }

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

  async updateGuarantee(
    guarantee: Guarantee,
    guaranteeItems: GuaranteeItem[]
  ): Promise<Guarantee> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          if (guaranteeItems) {
            await transactionEntityManager.remove(
              GuaranteeItem,
              guarantee.guaranteeItems
            );
            guarantee.guaranteeItems = guaranteeItems;
          }

          await transactionEntityManager.save(guarantee);
        } catch (e) {
          throw e;
        }
      });

      return guarantee;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  private hasQuery(searchConditions: IGuaranteeQuery) {
    return Object.values(searchConditions).some((sc) => sc !== undefined);
  }

  private getWhereClause(qs: IGuaranteeQuery, ids: number[]) {
    const where: any = {};

    where[qs.documentNumber && "documentNumber"] = Like(
      `%${qs.documentNumber}%`
    );
    where[qs.status && "status"] = qs.status;
    where[qs.guaranteeType && "guaranteeType"] = qs.guaranteeType;
    where[qs.name && "name"] = Like(`%${qs.name}%`);
    where[qs.fiscalYear && "fiscalYear"] = qs.fiscalYear;

    if (qs.permittedOrganizationIds && qs.permittedOrganizationIds.length > 0) {
      where.organizationId = In(qs.permittedOrganizationIds);
    }

    if (ids && ids.length > 0) {
      where.id = In(ids);
    }
    if (ids === null) {
      where.id = null;
    }
    if (qs.startDate && qs.endDate) {
      where.documentDate = Between(qs.startDate, qs.endDate);
    }
    if (qs.startDate && !qs.endDate) {
      where.documentDate = MoreThanOrEqual(qs.startDate);
    }
    if (!qs.startDate && qs.endDate) {
      where.documentDate = LessThanOrEqual(qs.endDate);
    }

    delete where.undefined;

    return [where];
  }

  private async getSubQuery(qs: IGuaranteeQuery): Promise<number[]> {
    try {
      const records = await getRepository(GuaranteeItem)
        .createQueryBuilder("ri")
        .select("DISTINCT(guaranteeId)")
        .where("ri.guarantor.firstname like :firstname", {
          firstname: qs.firstname ? `%${qs.firstname}%` : "%%"
        })
        .andWhere("ri.guarantor.lastname like :lastname", {
          lastname: qs.lastname ? `%${qs.lastname}%` : "%%"
        })
        .andWhere("ri.guarantor.idCardNo like :idCardNo", {
          idCardNo: qs.idCardNo ? `%${qs.idCardNo}%` : "%%"
        })
        .getRawMany();

      if (records.length === 0) return null;

      const ids = records.map((record) => record.guaranteeId);

      return ids;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(GuaranteeRepository);
