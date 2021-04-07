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
import { Agreement } from "../../entities/Agreement";
import { AgreementItem } from "../../entities/AgreementItem";
import { AgreementSequence } from "../../entities/AgreementSequence";
import { Guarantee } from "../../entities/Guarantee";
import { GuaranteeSequence } from "../../entities/GuaranteeSequence";
import { Request } from "../../entities/Request";
import { DBError } from "../../middlewares/error/error-type";
import {
  agreementStatusSet,
  loanTypeSet,
  requestStatusSet
} from "../../enumset";

export interface IAgreementQuery {
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
  status?: agreementStatusSet;
  statusExcludeList?: string[];
  fiscalYear?: string;
  permittedOrganizationIds?: number[];
  currentPage?: string;
  perPage?: string;
}

@EntityRepository(Agreement)
class AgreementRepository extends Repository<Agreement> {
  async findAgreements(
    qs: IAgreementQuery,
    options?: IGetOptions
  ): Promise<[Agreement[], number]> {
    const { currentPage = 1, perPage = 10, ...searchConditions } = qs;
    const {
      firstname,
      lastname,
      idCardNo,
      guarantorFirstname,
      guarantorLastname,
      guarantorIdCardNo
    } = searchConditions;
    const skip = (+currentPage - 1) * +perPage;

    try {
      let ids: number[] = [];
      if (
        this.hasQuery({
          firstname,
          lastname,
          idCardNo,
          guarantorFirstname,
          guarantorLastname,
          guarantorIdCardNo
        })
      ) {
        ids = await this.getSubQuery({
          firstname,
          lastname,
          idCardNo,
          guarantorFirstname,
          guarantorLastname,
          guarantorIdCardNo
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
        order: { documentDate: "DESC", documentNumber: "DESC" },
        skip,
        take: +perPage
      });

      return [records, total];
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async createAgreementAndGuarantee(
    agreement: Agreement,
    guarantee: Guarantee,
    agreementSequence: AgreementSequence,
    request: Request
    // guaranteeSequence: GuaranteeSequence
  ): Promise<Request> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          // increment agreementSequenceNumber by 1
          const agreementUpdateResult = await transactionEntityManager
            .createQueryBuilder()
            .update(AgreementSequence)
            .set({ sequenceNumber: () => "sequenceNumber + 1" })
            .whereEntity(agreementSequence)
            .execute();

          // get updated agreementSequenceNumber
          const updatedAgreementSequence = await transactionEntityManager.findOne(
            AgreementSequence,
            {
              id: agreementSequence.id,
              updatedDate: agreementUpdateResult.generatedMaps[0].updatedDate
            }
          );

          // set documentNumber of agreement && guarantee
          agreement.documentNumber = updatedAgreementSequence.runningNumber;
          guarantee.documentNumber = agreement.documentNumber;

          // add guarantee to agreement
          // agreement.guarantee = guarantee;

          // create agreement && guarantee
          agreement.setAge();
          await transactionEntityManager.save(agreement);
          // guarantee.documentNumber = agreement.documentNumber;
          guarantee.agreementId = agreement.id;
          guarantee.agreementDocumentDate = agreement.documentDate;
          guarantee.agreementDocumentNumber = agreement.documentNumber;
          guarantee.setAge();
          await transactionEntityManager.save(guarantee);

          // change requestStatus after create agreement && guarantee
          request.status = requestStatusSet.done;
          await transactionEntityManager.save(request);
          // await transactionEntityManager.update(
          //   Request,
          //   { id: agreement.request.id },
          //   { status: requestStatusSet.done }
          // );

          // update guarantee field in agreement
          await transactionEntityManager.update(
            Agreement,
            { id: agreement.id },
            {
              guaranteeId: guarantee.id,
              guaranteeDocumentDate: guarantee.documentDate,
              guaranteeDocumentNumber: guarantee.documentNumber
            }
          );
        } catch (e) {
          console.log(e);
          throw e;
        }
      });

      // return agreement;
      return request;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async createAgreement(
    agreement: Agreement,
    agreementSequence: AgreementSequence
  ): Promise<Agreement> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          const updateResult = await transactionEntityManager
            .createQueryBuilder()
            .update(AgreementSequence)
            .set({ sequenceNumber: () => "sequenceNumber + 1" })
            .whereEntity(agreementSequence)
            .execute();

          const updatedSequence = await transactionEntityManager.findOne(
            AgreementSequence,
            {
              id: agreementSequence.id,
              updatedDate: updateResult.generatedMaps[0].updatedDate
            }
          );

          agreement.documentNumber = updatedSequence.runningNumber;

          await transactionEntityManager.save(agreement);

          // if create agreement success change requestStatus to done
          await transactionEntityManager.update(
            Request,
            { id: agreement.requestId },
            { status: requestStatusSet.done }
          );
        } catch (e) {
          throw e;
        }
      });

      return agreement;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateAgreement(
    agreement: Agreement,
    agreementItems?: AgreementItem[]
  ): Promise<Agreement> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          if (agreementItems) {
            await transactionEntityManager.remove(
              AgreementItem,
              agreement.agreementItems
            );
            agreement.agreementItems = agreementItems;
          }

          await transactionEntityManager.save(agreement);
        } catch (e) {
          throw e;
        }
      });

      return agreement;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  private hasQuery(searchConditions: IAgreementQuery) {
    return Object.values(searchConditions).some((sc) => sc !== undefined);
  }

  private getWhereClause(qs: IAgreementQuery, ids: number[]) {
    const where: any = {};

    where[qs.documentNumber && "documentNumber"] = Like(
      `%${qs.documentNumber}%`
    );
    where[qs.status && "status"] = qs.status;
    where[qs.statusExcludeList && "status"] = Not(In(qs.statusExcludeList));
    where[qs.agreementType && "agreementType"] = qs.agreementType;
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

  private async getSubQuery(qs: IAgreementQuery): Promise<number[]> {
    try {
      const records = await getRepository(AgreementItem)
        .createQueryBuilder("ai")
        .select("DISTINCT(agreementId)")
        .where("ai.borrower.firstname like :firstname", {
          firstname: qs.firstname ? `%${qs.firstname}%` : "%%"
        })
        .andWhere("ai.borrower.lastname like :lastname", {
          lastname: qs.lastname ? `%${qs.lastname}%` : "%%"
        })
        .andWhere("ai.borrower.idCardNo like :idCardNo", {
          idCardNo: qs.idCardNo ? `%${qs.idCardNo}%` : "%%"
        })
        .andWhere("ai.guarantor.firstname like :guarantorFirstname", {
          guarantorFirstname: qs.guarantorFirstname
            ? `%${qs.guarantorFirstname}%`
            : "%%"
        })
        .andWhere("ai.guarantor.lastname like :guarantorLastname", {
          guarantorLastname: qs.guarantorLastname
            ? `%${qs.guarantorLastname}%`
            : "%%"
        })
        .andWhere("ai.guarantor.idCardNo like :guarantorIdCardNo", {
          guarantorIdCardNo: qs.guarantorIdCardNo
            ? `%${qs.guarantorIdCardNo}%`
            : "%%"
        })
        .getRawMany();

      if (records.length === 0) return null;

      const ids = records.map((record) => record.agreementId);

      return ids;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(AgreementRepository);
