import {
  Brackets,
  EntityRepository,
  getCustomRepository,
  getManager,
  getRepository,
  Repository
} from "typeorm";

import moment = require("moment");
import { AccountReceivable } from "../../entities/AccountReceivable";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { Agreement } from "../../entities/Agreement";
import { AttachedFile } from "../../entities/AttachedFile";
import { DebtCollection } from "../../entities/DebtCollection";
import {
  accountReceiviableStatusSet,
  creditStatusSet,
  loanTypeSet,
  debtInterruptReasonSet
} from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";
import { IPagination } from "./SearchRepository";

export interface IAccountReceivableFilter {
  documentNumber: string;
  permittedOrganizationIds: number[] | string[];
  agreementType: loanTypeSet;
  firstname: string;
  lastname: string;
  idCardNo: string;
  guarantorIdCardNo: string;
  guarantorFirstname: string;
  guarantorLastname: string;
  status: accountReceiviableStatusSet;
  name: string;
  startDate: string;
  endDate: string;
  fiscalYear: string;
}

export interface IDebtCollectionFilter {
  arDocumentNumber: string;
  permittedOrganizationIds: number[] | string[];
  agreementType: loanTypeSet;
  prescriptionRemainingStartDate: string;
  prescriptionRemainingEndDate: string;
  step: number;
  firstname: string;
  lastname: string;
  idCardNo: string;
  noPaymentStart: string;
  noPaymentEnd: string;
  asOfYearMonth: string;
  creditStatus: creditStatusSet;
  deathNotification: string;
  status: accountReceiviableStatusSet;
}

interface IFindAccountReceivableOptions {
  selected?: string[];
  relations?: string[];
}

interface IVerifyAccount {
  idCardNo: string;
  agreementId: string;
}

interface IPaymentTransaction {
  transaction: AccountReceivableTransaction;
  accountReceivable: AccountReceivable;
  collection: DebtCollection;
  agreement: Agreement;
}

@EntityRepository(AccountReceivable)
class AccountReceivableRepository extends Repository<AccountReceivable> {
  async findAccountReceivable(
    id: string | number,
    options: IFindAccountReceivableOptions = {}
  ) {
    const { selected = [], relations = [] } = options;
    try {
      const queryBuilder = this.createQueryBuilder("ar");

      selected.forEach((s) => {
        queryBuilder.select(`ar.${s}`);
      });

      relations.forEach((r) => {
        let rel = `ar.${r}`;
        let alias = r;
        const array = r.split(".");
        if (array.length > 1) {
          alias = array.pop();
          rel = `${array.pop()}.${alias}`;
        }
        queryBuilder.leftJoinAndSelect(rel, alias);
      });

      queryBuilder.leftJoinAndSelect("ar.controls", "control");

      queryBuilder.leftJoinAndMapOne(
        "ar.collection",
        "ar.collections",
        "debtCollection",
        "debtCollection.active = true"
      );
      queryBuilder.leftJoinAndMapMany(
        "ar.atfs",
        "AttachedFile",
        "attachedFile1",
        "attachedFile1.refId = ar.debtAcknowledgement.preAccountReceivableId and attachedFile1.refType = :refType1",
        { refType1: "ACKNOWLEDGEMENT.ATTACHEDFILE" }
      );

      queryBuilder.where("ar.id = :arId", { arId: id });
      queryBuilder.orderBy("control.asOfDate", "DESC");
      queryBuilder.addOrderBy("transactions.paidDate", "DESC");
      queryBuilder.addOrderBy("transactions.createdDate", "DESC");
      queryBuilder.addOrderBy("transactions.id", "DESC");

      const entity = await queryBuilder.getOne();
      entity.control = entity.controls[0];

      return entity;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }

  async findAccountReceivablesAndCount(
    filter: IAccountReceivableFilter,
    pagination: IPagination = {}
  ) {
    const {
      documentNumber,
      permittedOrganizationIds,
      agreementType,
      firstname,
      lastname,
      idCardNo,
      guarantorIdCardNo,
      guarantorFirstname,
      guarantorLastname,
      status,
      name,
      startDate,
      endDate,
      fiscalYear
    } = filter;

    const skip = (+pagination.currentPage - 1) * +pagination.perPage;

    try {
      const queryBuilder = this.createQueryBuilder("ar")
        .leftJoinAndSelect("ar.organization", "organization")
        .leftJoinAndSelect("ar.agreement", "agreement")
        .leftJoinAndMapOne("ar.control", "ar.controls", "control");

      queryBuilder.where(
        new Brackets((qb) => {
          qb.where((qb1) => {
            const subQuery = qb1
              .subQuery()
              .select("control.id")
              .from("AccountReceivableControl", "control")
              .where("control.accountReceivableId = ar.id")
              .orderBy("control.asOfDate", "DESC")
              .limit(1);
            return `control.id = ${subQuery.getQuery()}`;
          }).orWhere("control.id IS NULL");
        })
      );

      // filter from agreement
      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("agreement.id")
          .from(Agreement, "agreement")
          .leftJoin("agreement.agreementItems", "agreementItem");

        if (firstname) {
          subQuery.where("agreementItem.borrower.firstname like :firstname", {
            firstname: `%${firstname.trim()}%`
          });
        }
        if (lastname) {
          subQuery.andWhere("agreementItem.borrower.lastname like :lastname", {
            lastname: `%${lastname.trim()}%`
          });
        }
        if (idCardNo) {
          subQuery.andWhere("agreementItem.borrower.idCardNo like :idCardNo", {
            idCardNo: `%${idCardNo.trim()}%`
          });
        }
        if (guarantorFirstname) {
          subQuery.andWhere(
            "agreementItem.guarantor.firstname like :guarantorFirstname",
            {
              guarantorFirstname: `%${guarantorFirstname.trim()}%`
            }
          );
        }
        if (guarantorLastname) {
          subQuery.andWhere(
            "agreementItem.guarantor.lastname like :guarantorLastname",
            {
              guarantorLastname: `%${guarantorLastname.trim()}%`
            }
          );
        }
        if (guarantorIdCardNo) {
          subQuery.andWhere(
            "agreementItem.guarantor.idCardNo like :guarantorIdCardNo",
            {
              guarantorIdCardNo: `%${guarantorIdCardNo.trim()}%`
            }
          );
        }
        if (documentNumber) {
          subQuery.andWhere("agreement.documentNumber like :documentNumber", {
            documentNumber: `%${documentNumber.trim()}%`
          });
        }
        if (agreementType) {
          subQuery.andWhere("agreement.agreementType = :agreementType", {
            agreementType
          });
        }

        return "ar.agreementId IN " + subQuery.getQuery();
      });

      if (name) {
        queryBuilder.andWhere("ar.name like :name", {
          name: `%${name.trim()}%`
        });
      }
      if (permittedOrganizationIds) {
        queryBuilder.andWhere("ar.organizationId IN(:orgIds)", {
          orgIds: permittedOrganizationIds
        });
      }
      if (status) {
        queryBuilder.andWhere("ar.status = :status", {
          status
        });
      }
      if (startDate) {
        queryBuilder.andWhere("ar.documentDate >= :startDate", {
          startDate
        });
      }

      if (endDate) {
        queryBuilder.andWhere("ar.documentDate <= :endDate", {
          endDate
        });
      }

      if (fiscalYear) {
        queryBuilder.andWhere("ar.fiscalYear = :fiscalYear", { fiscalYear });
      }

      queryBuilder.orderBy({
        "ar.fiscalYear": "DESC",
        "ar.startDate": "DESC",
        "organization.orgCode": "ASC"
      });

      const [entities, total] = await queryBuilder
        .skip(skip)
        .take(pagination.perPage)
        .getManyAndCount();

      return [entities, total];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }

  async findAccountReceivablesWithDebtCollectionAndCount(
    filter: IDebtCollectionFilter,
    pagination: IPagination = {}
  ): Promise<[AccountReceivable[], number]> {
    const {
      arDocumentNumber,
      permittedOrganizationIds,
      agreementType,
      prescriptionRemainingStartDate,
      prescriptionRemainingEndDate,
      step,
      firstname,
      lastname,
      idCardNo,
      noPaymentStart,
      noPaymentEnd,
      asOfYearMonth,
      creditStatus,
      deathNotification,
      status
    } = filter;
    const skip = (+pagination.currentPage - 1) * +pagination.perPage;
    const today = moment(new Date());
    try {
      const queryBuilder = this.createQueryBuilder("ar")
        .leftJoinAndSelect("ar.organization", "organization")
        .leftJoinAndSelect("ar.agreement", "agreement")
        .leftJoinAndMapOne(
          "ar.collection",
          "ar.collections",
          "debtCollection",
          "debtCollection.active = true"
        )
        .leftJoinAndMapOne("ar.control", "ar.controls", "control");

      queryBuilder.where(
        new Brackets((qb) => {
          qb.where((qb1) => {
            const subQuery = qb1
              .subQuery()
              .select("control.id")
              .from("AccountReceivableControl", "control")
              .where("control.accountReceivableId = ar.id")
              .orderBy("control.asOfDate", "DESC")
              .limit(1);
            return `control.id = ${subQuery.getQuery()}`;
          }).orWhere("control.id IS NULL");
        })
      );

      queryBuilder.andWhere("ar.tentativeOverdueDate < :today", {
        today: today.format("YYYY-MM-DD")
      });

      // filter from agreement
      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("agreement.id")
          .from(Agreement, "agreement")
          .leftJoin("agreement.agreementItems", "agreementItem");

        if (firstname) {
          subQuery.where("agreementItem.borrower.firstname like :firstname", {
            firstname: `%${firstname.trim()}%`
          });
        }
        if (lastname) {
          subQuery.andWhere("agreementItem.borrower.lastname like :lastname", {
            lastname: `%${lastname.trim()}%`
          });
        }
        if (idCardNo) {
          subQuery.andWhere("agreementItem.borrower.idCardNo like :idCardNo", {
            idCardNo: `%${idCardNo.trim()}%`
          });
        }
        if (arDocumentNumber) {
          subQuery.andWhere("agreement.documentNumber like :arDocumentNumber", {
            arDocumentNumber: `%${arDocumentNumber.trim()}%`
          });
        }
        if (agreementType) {
          subQuery.andWhere("agreement.agreementType = :agreementType", {
            agreementType
          });
        }

        return "ar.agreementId IN " + subQuery.getQuery();
      });

      if (step) {
        queryBuilder.andWhere("debtCollection.step =:step", { step });
      }

      if (permittedOrganizationIds) {
        queryBuilder.andWhere("ar.organizationId IN(:orgIds)", {
          orgIds: permittedOrganizationIds
        });
      }

      if (status) {
        queryBuilder.andWhere("ar.status = :status", {
          status
        });
      } else {
        queryBuilder.andWhere("ar.status != '11'");
      }

      // อายุความคงเหลือ
      if (prescriptionRemainingStartDate) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            // กรณีตาย
            qb.where(
              "debtCollection.deathNotification.isConfirm = true AND DATE_ADD(debtCollection.deathNotification.notificationDate, INTERVAL 1 YEAR) >= :remainingStartDate",
              {
                remainingStartDate: prescriptionRemainingStartDate
              }
              // กรณีปกติ
            ).orWhere(
              "(debtCollection.id IS NULL OR debtCollection.deathNotification.isConfirm <> true)  AND DATE_ADD(ar.tentativeOverdueDate, INTERVAL 5 YEAR) >= :remainingStartDate",
              {
                remainingStartDate: prescriptionRemainingStartDate
              }
            );
          })
        );
      }
      if (prescriptionRemainingEndDate) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            // กรณีตาย
            qb.where(
              "debtCollection.deathNotification.isConfirm = true AND DATE_ADD(debtCollection.deathNotification.notificationDate, INTERVAL 1 YEAR) <= :remainingEndDate",
              {
                remainingEndDate: prescriptionRemainingEndDate
              }
              // กรณีปกติ
            ).orWhere(
              "(debtCollection.id IS NULL OR debtCollection.deathNotification.isConfirm <> true)  AND DATE_ADD(ar.tentativeOverdueDate, INTERVAL 5 YEAR) <= :remainingEndDate",
              {
                remainingEndDate: prescriptionRemainingEndDate
              }
            );
          })
        );
      }

      if (noPaymentStart) {
        queryBuilder.andWhere("ar.tentativeOverdueDate >= :noPaymentStart", {
          noPaymentStart
        });
      }

      if (noPaymentEnd) {
        queryBuilder.andWhere("ar.tentativeOverdueDate <= :noPaymentEnd", {
          noPaymentEnd
        });
      }

      if (asOfYearMonth) {
        const [year, month] = asOfYearMonth.split("-");
        const startDate = moment([year, +month - 1]);
        const endDate = moment(startDate).endOf("month");
        queryBuilder.andWhere(
          "control.asOfDate BETWEEN :startDate AND :endDate",
          {
            startDate: startDate.format("YYYY-MM-DD"),
            endDate: endDate.format("YYYY-MM-DD")
          }
        );
      }

      if (creditStatus) {
        queryBuilder.andWhere("control.status = :creditStatus", {
          creditStatus
        });
      }

      if (deathNotification === "true") {
        queryBuilder.andWhere("debtCollection.deathNotification.isConfirm = 1");
      } else if (deathNotification === "false") {
        queryBuilder.andWhere(
          "debtCollection.deathNotification.isConfirm <> 1"
        );
      }

      queryBuilder.orderBy("ar.tentativeOverdueDate", "DESC");

      const [entities, total] = await queryBuilder
        .skip(skip)
        .take(pagination.perPage)
        .getManyAndCount();

      return [entities, total];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }

  async updateAccountReceivable(
    accountReceivable: AccountReceivable,
    collection?: DebtCollection,
    newAccountReceivable?: AccountReceivable,
    atfs?: any
  ) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        // update AttachedFiles
        if (atfs && atfs.length > 0) {
          const attachedFiles = getRepository(AttachedFile).create(atfs);

          await transactionEntityManager.save(attachedFiles);
        }
        await transactionEntityManager.save(accountReceivable);
        if (collection) {
          await transactionEntityManager.save(collection);
        }
        // ถ้ามีการรับสภาพหนี้
        if (newAccountReceivable) {
          await transactionEntityManager.save(newAccountReceivable);
          return newAccountReceivable;
        }

        return accountReceivable;
      });
    } catch (err) {
      if (err.constructor.errorCode === 400) {
        throw err;
      }
      throw new DBError({ message: err.message });
    }
  }
  async closeAccountReceivable(
    accountReceivable: AccountReceivable,
    agreement: Agreement,
    transaction?: AccountReceivableTransaction
  ) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(accountReceivable);

        if (transaction) {
          await transactionEntityManager.save(transaction);
        }

        // ปรับปรุงสัญญาเงินกู้
        await transactionEntityManager.update(Agreement, agreement.id, {
          closeDate: agreement.closeDate,
          status: agreement.status
        });

        return accountReceivable;
      });
    } catch (err) {
      if (err.constructor.errorCode === 400) {
        throw err;
      }
      throw new DBError({ message: err.message });
    }
  }

  // for Payment2ApiController
  async verifyAccount(
    verifyOptions: IVerifyAccount
  ): Promise<[AccountReceivable[], number]> {
    const { idCardNo, agreementId } = verifyOptions;

    const queryBuilder = this.createQueryBuilder("ar")
      .leftJoinAndSelect("ar.organization", "organization")
      .innerJoinAndSelect("ar.agreement", "agreement")
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select("agreementItem.agreementId")
          .from("AgreementItem", "agreementItem")
          .where("agreementItem.borrower.idCardNo = :idCardNo")
          .getQuery();
        return "agreement.id in " + subQuery;
      })
      .setParameter("idCardNo", idCardNo)
      .andWhere("ar.status != :status", {
        status: accountReceiviableStatusSet.close
      });

    // กรณีส่งค่า agreementId
    if (agreementId) {
      queryBuilder.andWhere("ar.agreementId = :id", { id: agreementId });
    }

    // ค้นหาลูกหนี้ที่สถานะยังไม่ปิดบัญชี(11)
    queryBuilder.andWhere("ar.status != :status", {
      status: accountReceiviableStatusSet.close
    });

    // เรียงลำดับข้อมูลตามวันที่เอกสารจากล่าสุดก่อน
    queryBuilder.orderBy("ar.documentDate", "DESC");

    try {
      const [
        accountReceivableList,
        total
      ] = await queryBuilder.getManyAndCount();

      return [accountReceivableList, total];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async findAccountReceivableForPayment(
    accountReceivableId: string
  ): Promise<AccountReceivable> {
    try {
      const accountReceivable = await this.createQueryBuilder("ar")
        .leftJoinAndSelect("ar.agreement", "agreement")
        .leftJoinAndMapOne(
          "ar.collection",
          "ar.collections",
          "debtCollection",
          "debtCollection.active = true"
        )
        .where("ar.id = :accountReceivableId", { accountReceivableId })
        .getOne();

      return accountReceivable;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async createPaymentTransaction(
    paymentTransactionOptions: IPaymentTransaction
  ): Promise<
    [
      string,
      AccountReceivable,
      AccountReceivableTransaction,
      DebtCollection,
      Agreement
    ]
  > {
    const {
      transaction,
      accountReceivable,
      collection,
      agreement
    } = paymentTransactionOptions;
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(transaction, { listeners: false });
        await transactionEntityManager.save(accountReceivable, {
          listeners: false
        });
        if (collection) {
          collection.interruptData(
            debtInterruptReasonSet.paid,
            "ACCOUNT_RECEIVABLE_TRANSACTION",
            transaction.id
          );
          await transactionEntityManager.save(collection, { listeners: false });
        }
        await transactionEntityManager.save(agreement);
      });

      return [null, accountReceivable, transaction, collection, agreement];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async cancelPaymentTransaction(
    paymentTransactionOptions: IPaymentTransaction
  ) {
    const {
      transaction,
      accountReceivable,
      collection,
      agreement
    } = paymentTransactionOptions;
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(transaction, { listeners: false });
        await transactionEntityManager.save(accountReceivable, {
          listeners: false
        });
        if (collection) {
          await transactionEntityManager.save(collection, { listeners: false });
        }
        await transactionEntityManager.save(agreement);
      });

      return [null, accountReceivable, transaction, collection, agreement];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(AccountReceivableRepository);
