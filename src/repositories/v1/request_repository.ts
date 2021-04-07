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
  Not,
  Repository
} from "typeorm";

import { IGetOptions } from "../../controllers/v1/base_controller";
import { AttachedFile } from "../../entities/AttachedFile";
import { BudgetAllocationItem } from "../../entities/BudgetAllocationItem";
import { Request } from "../../entities/Request";
import { RequestFactSheet } from "../../entities/RequestFactSheet";
import { RequestItem } from "../../entities/RequestItem";
import { RequestSequence } from "../../entities/RequestSequence";
import { loanTypeSet, requestStatusSet } from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";

export interface IRequestQuery {
  documentNumber?: string;
  organizationId?: number;
  requestType?: loanTypeSet;
  firstname?: string;
  lastname?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  idCardNo?: string;
  status?: number;
  statusExcludeList?: string[];
  fiscalYear?: string;
  ids?: number[];
  permittedOrganizationIds?: number[];
  currentPage?: string;
  perPage?: string;
}

@EntityRepository(Request)
class RequestRepository extends Repository<Request> {
  async findRequests(
    qs: IRequestQuery,
    options: IGetOptions
  ): Promise<[Request[], number]> {
    const { currentPage = 1, perPage = 10, ...searchConditions } = qs;
    const { firstname, lastname, idCardNo, ids } = searchConditions;
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
          ? this.getWhereClause(searchConditions, ids ? ids : subIds)
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

  async createRequest(
    request: Request
    // requestSequence: RequestSequence
  ): Promise<Request> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          // const updateResult = await transactionEntityManager
          //   .createQueryBuilder()
          //   .update(RequestSequence)
          //   .set({ sequenceNumber: () => "sequenceNumber + 1" })
          //   .whereEntity(requestSequence)
          //   .execute();

          // const updatedSequence = await transactionEntityManager.findOne(
          //   RequestSequence,
          //   {
          //     id: requestSequence.id,
          //     updatedDate: updateResult.generatedMaps[0].updatedDate
          //   }
          // );

          // request.documentNumber = updatedSequence.runningNumber;

          await transactionEntityManager.save(request);
        } catch (e) {
          throw e;
        }
      });

      return request;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateRequest(
    request: Request,
    requestItems: RequestItem[],
    budgetAllocationItems: BudgetAllocationItem[],
    requestSequence: RequestSequence,
    factSheet: RequestFactSheet,
    attachedFiles?: AttachedFile[]
  ): Promise<Request> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          if (requestSequence) {
            const updateResult = await transactionEntityManager
              .createQueryBuilder()
              .update(RequestSequence)
              .set({ sequenceNumber: () => "sequenceNumber + 1" })
              .whereEntity(requestSequence)
              .execute();

            const updatedSequence = await transactionEntityManager.findOne(
              RequestSequence,
              {
                id: requestSequence.id,
                updatedDate: updateResult.generatedMaps[0].updatedDate
              }
            );

            request.documentNumber = updatedSequence.runningNumber;
          }
          if (budgetAllocationItems) {
            await transactionEntityManager.remove(
              BudgetAllocationItem,
              request.budgetAllocationItems
            );
            request.budgetAllocationItems = budgetAllocationItems;
          }
          if (requestItems) {
            await transactionEntityManager.remove(
              RequestItem,
              request.requestItems
            );
            request.requestItems = requestItems;
          }
          // if (
          //   factSheet &&
          //   factSheet.attachedFiles &&
          //   factSheet.attachedFiles.length > 0
          // ) {
          //   const ats = await transactionEntityManager.save(
          //     factSheet.attachedFiles
          //   );

          //   factSheet.attachedFiles = ats;
          // }
          request.factSheet = factSheet;

          await transactionEntityManager.save(attachedFiles);

          await transactionEntityManager.save(request);
        } catch (e) {
          throw e;
        }
      });
      return request;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateAttachedFiles(
    requestItem: RequestItem,
    resource: string,
    attachedFiles: AttachedFile[]
  ): Promise<AttachedFile[]> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          const ats = await transactionEntityManager.save(attachedFiles);

          // requestItem[`${resource}`].attachedFiles = ats;

          await transactionEntityManager.save(RequestItem, requestItem);
        } catch (e) {
          throw e;
        }
      });
      return requestItem[`${resource}`].attachedFiles;
    } catch (e) {
      console.log(e);
      throw new DBError({ message: e.message });
    }
  }

  async createOrUpdateFactSheet(
    factSheet: RequestFactSheet,
    attachedFiles: AttachedFile[]
  ) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          await transactionEntityManager.save(attachedFiles);

          // factSheet.attachedFiles = ats;
          await transactionEntityManager.save(RequestFactSheet, factSheet);
        } catch (e) {
          throw e;
        }
      });
      return factSheet;
    } catch (e) {
      throw new DBError({
        name: "ไม่สามารถสร้างแบบสอบข้อเท็จจริงได้",
        message: e.message
      });
    }
  }

  private hasQuery(searchConditions: IRequestQuery) {
    return Object.values(searchConditions).some((sc) => sc !== undefined);
  }

  private getWhereClause(qs: IRequestQuery, ids: number[]) {
    const where: any = {};

    where[qs.documentNumber && "documentNumber"] = Like(
      `%${qs.documentNumber}%`
    );
    where[qs.status && "status"] = qs.status;
    where[qs.statusExcludeList && "status"] = Not(In(qs.statusExcludeList));
    where[qs.requestType && "requestType"] = qs.requestType;
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

  private async getSubQuery(qs: IRequestQuery): Promise<number[]> {
    try {
      const records = await getRepository(RequestItem)
        .createQueryBuilder("ri")
        .select("DISTINCT(requestId)")
        .where("ri.borrower.firstname like :firstname", {
          firstname: qs.firstname ? `%${qs.firstname}%` : "%%"
        })
        .andWhere("ri.borrower.lastname like :lastname", {
          lastname: qs.lastname ? `%${qs.lastname}%` : "%%"
        })
        .andWhere("ri.borrower.idCardNo like :idCardNo", {
          idCardNo: qs.idCardNo ? `%${qs.idCardNo}%` : "%%"
        })
        .getRawMany();

      if (records.length === 0) return null;

      const ids = records.map((record) => record.requestId);

      return ids;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  private async getBudgetAllocationItems(id: number) {
    try {
      const records = await getRepository(BudgetAllocationItem)
        .createQueryBuilder()
        .select(["id", "description", "quality", "price"])
        .addSelect("(quality * price)", "total")
        .where("requestId = :id", { id })
        .getRawMany();
      return records;
    } catch (e) {
      throw e;
    }
  }

  private async getTotalBudget(id: number) {
    try {
      const raw = await getRepository(BudgetAllocationItem)
        .createQueryBuilder()
        .select("SUM(quality * price)", "sum")
        .where("requestId = :id", { id })
        .getRawOne();
      return +raw.sum;
    } catch (e) {
      throw e;
    }
  }
}

export default getCustomRepository(RequestRepository);
