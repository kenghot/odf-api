import {
  Between,
  EntityRepository,
  getCustomRepository,
  getManager,
  In,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository
} from "typeorm";
import { AgreementRepository } from ".";
import { IGetOptions } from "../../controllers/v1/base_controller";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { loanTypeSet } from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";

export interface IARQuery {
  documentNumber?: string;
  organizationId?: number;
  agreementType?: loanTypeSet;
  firstname?: string;
  lastname?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  idCardNo?: string;
  guarantorFirstname?: string;
  guarantorLastname?: string;
  guarantorIdCardNo?: string;
  status?: number;
  fiscalYear?: string;
  permittedOrganizationIds?: number[];
  currentPage?: string;
  perPage?: string;
}
@EntityRepository(AccountReceivable)
class AccountReceivableRepository extends Repository<AccountReceivable> {
  async findAccountReceivables(
    qs: IARQuery,
    options: IGetOptions
  ): Promise<[AccountReceivable[], number]> {
    const { currentPage = 1, perPage = 10, ...searchConditions } = qs;
    const {
      firstname,
      lastname,
      idCardNo,
      guarantorFirstname,
      guarantorLastname,
      guarantorIdCardNo,
      agreementType
    } = searchConditions;
    const skip = (+currentPage - 1) * +perPage;
    try {
      let subIds: number[] = [];
      if (
        this.hasQuery({
          firstname,
          lastname,
          idCardNo,
          guarantorFirstname,
          guarantorLastname,
          guarantorIdCardNo,
          agreementType
        })
      ) {
        subIds = await this.getSubQuery({
          firstname,
          lastname,
          idCardNo,
          guarantorFirstname,
          guarantorLastname,
          guarantorIdCardNo,
          agreementType
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

  async createAccountReceivable(
    accountReceivable: AccountReceivable
  ): Promise<AccountReceivable> {
    try {
      const entity = this.create(accountReceivable);

      await this.save(entity);

      return entity;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateAccountReceivable(
    accountReceivable: AccountReceivable,
    transactions: AccountReceivableTransaction[]
  ): Promise<AccountReceivable> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          if (transactions) {
            await transactionEntityManager.remove(
              AccountReceivableTransaction,
              accountReceivable.transactions
            );
            accountReceivable.transactions = transactions;
          }

          await transactionEntityManager.save(accountReceivable);
        } catch (e) {
          throw e;
        }
      });

      return accountReceivable;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  private hasQuery(searchConditions: IARQuery) {
    return Object.values(searchConditions).some((sc) => sc !== undefined);
  }

  private getWhereClause(qs: IARQuery, ids: number[]) {
    const where: any = {};

    where[qs.documentNumber && "documentNumber"] = Like(
      `%${qs.documentNumber}%`
    );

    where[qs.status && "status"] = qs.status;
    where[qs.name && "name"] = Like(`%${qs.name}%`);
    where[qs.fiscalYear && "fiscalYear"] = qs.fiscalYear;

    if (qs.permittedOrganizationIds && qs.permittedOrganizationIds.length > 0) {
      where.organizationId = In(qs.permittedOrganizationIds);
    }

    if (ids && ids.length > 0) {
      where.agreementId = In(ids);
    }
    if (ids === null) {
      where.agreementId = null;
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

  private async getSubQuery(qs: IARQuery): Promise<number[]> {
    try {
      const records = await AgreementRepository.createQueryBuilder("agreement")
        .leftJoinAndSelect("agreement.agreementItems", "agreementItem")
        .where("agreement.agreementType like :agreementType", {
          agreementType: qs.agreementType ? `%${qs.agreementType}%` : "%%"
        })
        .andWhere("agreementItem.borrower.firstname Like :firstname", {
          firstname: qs.firstname ? `%${qs.firstname}%` : "%%"
        })
        .andWhere("agreementItem.borrower.lastname Like :lastname", {
          lastname: qs.lastname ? `%${qs.lastname}%` : "%%"
        })
        .andWhere("agreementItem.borrower.idCardNo Like :idCardNo", {
          idCardNo: qs.idCardNo ? `%${qs.idCardNo}%` : "%%"
        })
        .andWhere(
          "agreementItem.guarantor.firstname Like :guarantorFirstname",
          {
            guarantorFirstname: qs.guarantorFirstname
              ? `%${qs.guarantorFirstname}%`
              : "%%"
          }
        )
        .andWhere("agreementItem.guarantor.lastname Like :guarantorLastname", {
          guarantorLastname: qs.guarantorLastname
            ? `%${qs.guarantorLastname}%`
            : "%%"
        })
        .andWhere("agreementItem.guarantor.idCardNo Like :guarantorIdCardNo", {
          guarantorIdCardNo: qs.guarantorIdCardNo
            ? `%${qs.guarantorIdCardNo}%`
            : "%%"
        })
        .getMany();

      if (records.length === 0) return null;

      const ids = records.map((record) => record.id);

      return ids;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(AccountReceivableRepository);
