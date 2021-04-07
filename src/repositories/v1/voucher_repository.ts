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

import { IGetOptions } from "../../controllers/v1/base_controller";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { Agreement } from "../../entities/Agreement";
import { AgreementItem } from "../../entities/AgreementItem";
import { Guarantee } from "../../entities/Guarantee";
import { Voucher } from "../../entities/Voucher";
import { VoucherItem } from "../../entities/VoucherItem";
import { VoucherSequence } from "../../entities/VoucherSequence";
import { agreementStatusSet, guaranteeStatusSet } from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";

export interface IVoucherQuery {
  documentNumber?: string;
  organizationId?: number;
  firstname?: string;
  lastname?: string;
  refDocumentNumber?: string;
  startDate?: string;
  endDate?: string;
  idCardNo?: string;
  status?: number;
  fiscalYear?: string;
  permittedOrganizationIds?: number[];
  currentPage?: string;
  perPage?: string;
}
@EntityRepository(Voucher)
class VoucherRepository extends Repository<Voucher> {
  async findVouchers(
    qs: IVoucherQuery,
    options: IGetOptions
  ): Promise<[Voucher[], number]> {
    const { currentPage = 1, perPage = 10, ...searchConditions } = qs;
    const { firstname, lastname, idCardNo } = searchConditions;
    const skip = (+currentPage - 1) * +perPage;
    try {
      let subIds: number[] = [];
      if (
        this.hasQuery({
          firstname,
          lastname,
          idCardNo
        })
      ) {
        subIds = await this.getSubQuery({
          firstname,
          lastname,
          idCardNo
        });
      }

      const records = await this.createQueryBuilder("voucher")
        .leftJoinAndSelect("voucher.organization", "organization")
        .leftJoinAndMapOne(
          "voucher.refDocument",
          Agreement,
          "agreement",
          "agreement.id = voucher.refId and voucher.refType = :refType",
          { refType: "AGREEMENT" }
        )
        .where("voucher.documentNumber like :documentNumber", {
          documentNumber: qs.documentNumber ? `%${qs.documentNumber}%` : "%%"
        })
        // .andWhere("voucher.refType like :refType", {
        //   refType: "AGREEMENT"
        // })
        .andWhere(
          `voucher.organizationId ${
            qs.permittedOrganizationIds &&
            qs.permittedOrganizationIds.length > 0
              ? "In(:organizationIds)"
              : "Not In(-1)"
          }`,
          { organizationIds: qs.permittedOrganizationIds }
        )
        .andWhere("agreement.documentNumber Like :refDocumentNumber", {
          refDocumentNumber: qs.refDocumentNumber
            ? `%${qs.refDocumentNumber}%`
            : "%%"
        })
        .andWhere(
          `voucher.refId ${
            subIds === null || subIds.length > 0 ? "In(:id)" : "Not In(-1)"
          }`,
          {
            id: subIds
          }
        )
        .andWhere("voucher.status like :status", {
          status: qs.status ? qs.status : "%%"
        })
        .andWhere("voucher.fiscalYear like :fiscalYear", {
          fiscalYear: qs.fiscalYear ? qs.fiscalYear : "%%"
        })
        .andWhere("voucher.documentDate >= :startDate", {
          startDate: qs.startDate ? qs.startDate : -1
        })
        .andWhere("voucher.documentDate <= :endDate", {
          endDate: qs.endDate ? qs.endDate : "NULL"
        })
        .skip(skip)
        .take(+perPage)
        .orderBy("voucher.documentDate", "DESC")
        .addOrderBy("voucher.documentNumber", "DESC")
        .getManyAndCount();
      return [records[0], records[1]];
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async createVoucher(
    voucher: Voucher,
    voucherSequence: VoucherSequence,
    agreement: Agreement
  ): Promise<Agreement> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          // increment agreementSequenceNumber by 1
          const voucherUpdateResult = await transactionEntityManager
            .createQueryBuilder()
            .update(VoucherSequence)
            .set({ sequenceNumber: () => "sequenceNumber + 1" })
            .whereEntity(voucherSequence)
            .execute();

          // get updated agreementSequenceNumber
          const updatedVoucherSequence = await transactionEntityManager.findOne(
            VoucherSequence,
            {
              id: voucherSequence.id,
              updatedDate: voucherUpdateResult.generatedMaps[0].updatedDate
            }
          );

          // set documentNumber of voucher
          voucher.documentNumber = updatedVoucherSequence.runningNumber;

          // calculate totalAmount before insert
          voucher.setTotalAmount();

          // create voucher
          await transactionEntityManager.save(voucher);

          // change requestStatus after create agreement && guarantee
          agreement.status = agreementStatusSet.duringPayment;
          agreement.guarantee.status = guaranteeStatusSet.duringPayment;
          await transactionEntityManager.save(agreement);
          // await transactionEntityManager.update(
          //   Agreement,
          //   { id: voucher.refId },
          //   { status: agreementStatusSet.duringPayment }
          // );
          agreement.voucher = voucher;
        } catch (e) {
          throw e;
        }
      });

      // return voucher;
      return agreement;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateVoucher(
    voucher: Voucher,
    voucherItems: VoucherItem[]
  ): Promise<Voucher> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          if (voucherItems) {
            await transactionEntityManager.remove(
              VoucherItem,
              voucher.voucherItems
            );
            voucher.voucherItems = voucherItems;
          }

          await transactionEntityManager.save(voucher);
        } catch (e) {
          throw e;
        }
      });
      return voucher;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }

  async updateVoucherAndCreateAR(
    voucher: Voucher,
    agreement: Agreement,
    guarantee: Guarantee,
    ar: AccountReceivable
  ): Promise<Voucher> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          await transactionEntityManager.save(voucher);
          await transactionEntityManager.save(agreement);
          guarantee.endDate = agreement.endDate;
          await transactionEntityManager.save(guarantee);
          ar.agreementInstallmentFirstDate = agreement.installmentFirstDate;
          ar.agreementInstallmentLastDate = agreement.installmentLastDate;
          await transactionEntityManager.save(ar);
        } catch (e) {
          console.log(e);
          throw e;
        }
      });
      return voucher;
    } catch (e) {
      console.log(e);
      throw new DBError({ message: e.message });
    }
  }

  private hasQuery(searchConditions: IVoucherQuery) {
    return Object.values(searchConditions).some((sc) => sc !== undefined);
  }

  private getWhereClause(qs: IVoucherQuery, ids: number[]) {
    const where: any = {};

    where[qs.documentNumber && "documentNumber"] = Like(
      `%${qs.documentNumber}%`
    );
    where.refType = "AGREEMENT";
    where[qs.refDocumentNumber && "refId"] = Like(`%${qs.refDocumentNumber}%`);
    where[qs.status && "status"] = qs.status;
    where[qs.fiscalYear && "fiscalYear"] = qs.fiscalYear;

    if (qs.permittedOrganizationIds && qs.permittedOrganizationIds.length > 0) {
      where.organizationId = In(qs.permittedOrganizationIds);
    }

    if (ids && ids.length > 0) {
      where.refId = In(ids);
    }
    if (ids === null) {
      where.refId = null;
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

  private async getSubQuery(qs: IVoucherQuery): Promise<number[]> {
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
        .getRawMany();

      if (records.length === 0) return null;

      const ids = records.map((record) => record.agreementId);

      return ids;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(VoucherRepository);
