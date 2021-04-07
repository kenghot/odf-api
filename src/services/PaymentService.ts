import { Brackets, DeepPartial, getManager, getRepository } from "typeorm";
import {
  paymentTypeSet,
  paymentMethodSet,
  accountReceiviableStatusSet,
  arTransactionStatusSet,
  debtInterruptReasonSet
} from "../enumset";
import { AccountReceivable } from "../entities/AccountReceivable";
import { AccountReceivableTransaction } from "../entities/AccountReceivableTransaction";
import { DebtCollection } from "../entities/DebtCollection";
import { Agreement } from "../entities/Agreement";

interface IPayment {
  accountReceivableId: number;
  paymentType: paymentTypeSet;
  paymentId: number;
  paymentMethod: paymentMethodSet;
  paymentReferenceNo: string;
  paidDate: string | Date;
  paidAmount: number;
}

export class PaymentService {
  static verifyAccount = async (
    idCardNo: string,
    agreementId?: string
  ): Promise<[AccountReceivable[], number]> => {
    let ars: any;
    let total: number;
    if (!agreementId) {
      [ars, total] = await getRepository(AccountReceivable)
        .createQueryBuilder("ar")
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
        })
        .orderBy("ar.documentDate", "DESC")
        .getManyAndCount();
    } else {
      [ars, total] = await getRepository(AccountReceivable)
        .createQueryBuilder("ar")
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
        .andWhere("ar.agreementId = :id", { id: agreementId })
        .andWhere("ar.status != :status", {
          status: accountReceiviableStatusSet.close
        })
        .orderBy("ar.documentDate", "DESC")
        .getManyAndCount();
    }
    return [ars, total];
  };

  static createTransaction = async (
    accountReceivableId: number,
    paymentType: paymentTypeSet,
    paymentId: number,
    paymentMethod: paymentMethodSet,
    paymentReferenceNo: string,
    paidDate: string | Date,
    paidAmount: number,
    notExecute?: boolean
  ): Promise<
    [
      number,
      AccountReceivable | null,
      AccountReceivableTransaction | null,
      DebtCollection | null,
      Agreement | null
    ]
  > => {
    // find ar
    const ar = await getRepository(AccountReceivable)
      .createQueryBuilder("ar")
      .leftJoinAndSelect("ar.agreement", "agreement")
      .leftJoinAndSelect("ar.organization", "organization")
      .leftJoinAndMapOne(
        "ar.collection",
        "ar.collections",
        "debtCollection",
        "debtCollection.active = true"
      )
      .where("ar.id = :accountReceivableId", { accountReceivableId })
      .getOne();

    // calculate new outstandingDebtBalance
    const newOutstandingDebtBalance = ar.outstandingDebtBalance - paidAmount;

    // check if outstandingDebtBalance < 0
    if (newOutstandingDebtBalance < 0) {
      return [403, null, null, null, null];
    } else {
      const transactionRepo = getRepository(AccountReceivableTransaction);

      // check if it already been done
      const [records, total] = await transactionRepo.findAndCount({
        accountReceivableId: ar.id,
        paymentReferenceNo,
        status: arTransactionStatusSet.normal
      });

      if (total > 0) {
        return [404, null, null, null, null];
      }

      // prepare transaction
      const tr: DeepPartial<AccountReceivableTransaction> = {
        accountReceivableId: ar.id,
        paymentType,
        paymentId,
        paymentMethod,
        paymentReferenceNo,
        paidDate,
        paidAmount,
        outstandingDebtBalance: newOutstandingDebtBalance,
        status: arTransactionStatusSet.normal,
        createdByName:
          // paymentType === paymentTypeSet.counterService ? "SYSCS" : undefined
          paymentType ? `SYS${paymentType}` : undefined
        //
      };
      // create transaction and update ar
      const transaction = transactionRepo.create(tr);

      ar.updatePaymentData(newOutstandingDebtBalance, paidDate);
      const { collection, agreement } = ar;

      if (notExecute) {
        return [null, ar, transaction, collection, agreement];
      }

      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(transaction, { listeners: false });
        await transactionEntityManager.save(ar, { listeners: false });
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

      return [null, ar, transaction, collection, agreement];
    }
  };

  static cancelTransaction = async (
    transactionId: number,
    cancelPaymentId: number,
    paidDate: string | Date,
    notExecute?: boolean
  ): Promise<
    [
      number,
      AccountReceivable | null,
      AccountReceivableTransaction | null,
      DebtCollection | null,
      Agreement | null
    ]
  > => {
    const transactionRepo = getRepository(AccountReceivableTransaction);
    const atr = await transactionRepo
      .createQueryBuilder("tr")
      .leftJoinAndSelect("tr.accountReceivable", "ar")
      .leftJoinAndSelect("ar.agreement", "agreement")
      .leftJoinAndMapOne(
        "ar.collection",
        "ar.collections",
        "debtCollection",
        // "debtCollection.active = true"
        "debtCollection.interruptRefId = tr.id AND debtCollection.interruptRefType = 'ACCOUNT_RECEIVABLE_TRANSACTION'"
      )
      .where("tr.id = :transactionId", { transactionId })
      .andWhere("tr.status = :status", {
        status: arTransactionStatusSet.normal
      })
      .getOne();

    if (!atr) {
      return [404, null, null, null, null];
    }

    let isClosed = false;

    const raw = await transactionRepo
      .createQueryBuilder("tr")
      .select("IFNULL(SUM(tr.paidAmount), 0)", "totalPaid")
      .where("tr.accountReceivableId = :arId", {
        arId: atr.accountReceivableId
      })
      .andWhere("tr.id != :trId", { trId: atr.id })
      .getRawMany();

    const totalPaid = raw[0]["totalPaid"];

    if (+totalPaid > +atr.accountReceivable.loanAmount) {
      isClosed = true;
    }

    const rawData = await transactionRepo.query(
      `SELECT   id,paidDate,status,paymentReferenceNo,
      IF( paymentReferenceNo in (select  paymentReferenceNo  from account_receivable_transactions
      where accountReceivableId  = ? and status = 'CL') , 1, 0 ) as canceled
      FROM account_receivable_transactions
     where   accountReceivableId  = ? AND id != ?
     order by paidDate desc, createdDate desc`,
      [atr.accountReceivableId, atr.accountReceivableId, atr.id]
    );
    const data = rawData.filter((r) => {
      return r.canceled !== "1";
    });
    const prevPaidDate = data && data[0] ? data[0].paidDate : null;

    const { accountReceivable } = atr;

    const newOutstandingDebtBalance =
      +accountReceivable.outstandingDebtBalance + +atr.paidAmount;

    accountReceivable.revertPaymentData(
      newOutstandingDebtBalance,
      prevPaidDate,
      isClosed
    );
    // accountReceivable.updatedByName = "SYSCS";

    const { collection, agreement } = accountReceivable;

    // // prepare transaction
    const newAtr: DeepPartial<AccountReceivableTransaction> = {
      accountReceivableId: atr.accountReceivableId,
      paymentType: atr.paymentType,
      paymentId: cancelPaymentId,
      paymentMethod: atr.paymentMethod,
      paymentReferenceNo: atr.paymentReferenceNo,
      paidDate,
      paidAmount: atr.paidAmount * -1,
      outstandingDebtBalance: newOutstandingDebtBalance,
      status: arTransactionStatusSet.cancel,
      createdByName:
        atr.paymentType === paymentTypeSet.counterService ? "SYSCS" : undefined
    };
    const transaction = transactionRepo.create(newAtr);

    if (notExecute) {
      return [null, accountReceivable, transaction, collection, agreement];
    }

    // update ar && create tr
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
  };
  // verifyTransaction
}
