import {
  EntityRepository,
  getCustomRepository,
  Repository,
  Brackets
} from "typeorm";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import {
  paymentTypeSet,
  arTransactionStatusSet,
  accountReceiviableStatusSet
} from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";

interface IFindTransactionToCancel {
  paymentReferenceNo: string;
  paymentType: paymentTypeSet;
}
interface IConfirmedTransaction {
  transactionId: string;
}

@EntityRepository(AccountReceivableTransaction)
class AccountReceivableTransactionRepository extends Repository<
  AccountReceivableTransaction
> {
  async findTransactionToCancel(
    transactionToCancel: IFindTransactionToCancel
  ): Promise<[AccountReceivableTransaction[], number]> {
    const { paymentReferenceNo, paymentType } = transactionToCancel;

    try {
      const [records, total] = await this.findAndCount(
        {
          where: {
            paymentReferenceNo,
            paymentType,
            status: arTransactionStatusSet.normal
          },
          relations: ["accountReceivable"]
        }
        // { relations: ["accountReceivable"] }
      );

      return [records, total];
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async findConfirmedTransaction(
    // confirmedTransaction: IConfirmedTransaction
    transactionId: string
  ): Promise<AccountReceivableTransaction> {
    // const { transactionId } = confirmedTransaction;
    try {
      const transaction = await this.createQueryBuilder("tr")
        .leftJoinAndSelect("tr.accountReceivable", "ar")
        .leftJoinAndSelect("ar.controls", "control")
        .leftJoinAndSelect("ar.agreement", "agreement")
        .leftJoinAndMapOne(
          "ar.collection",
          "ar.collections",
          "debtCollection",
          // "debtCollection.active = true"
          "debtCollection.interruptRefId = tr.id AND debtCollection.interruptRefType = 'ACCOUNT_RECEIVABLE_TRANSACTION'"
        )
        .leftJoinAndMapOne(
          "ar.control",
          "ar.controls",
          "controls",
          "controls.id = control.id"
        )
        .where("tr.id = :transactionId", { transactionId })
        .andWhere("tr.status = :status", {
          status: arTransactionStatusSet.normal
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where((qb1) => {
              const subQuery = qb1
                .subQuery()
                .select("MAX(control.createdDate)")
                .from("AccountReceivableControl", "control")
                .where("control.accountReceivableId = ar.id");
              return `control.createdDate = ${subQuery.getQuery()}`;
            }).orWhere("control.id IS NULL");
          })
        )
        .getOne();

      return transaction;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async findPreviousTransaction(accountReceivableId: number) {
    try {
      const previousTransactions = await this.find({
        where: {
          accountReceivableId: accountReceivableId,
          status: accountReceiviableStatusSet.normal
        },
        order: { createdDate: "DESC", paidDate: "DESC" },
        skip: 1,
        take: 1
      });

      return previousTransactions ? previousTransactions[0] : null;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
}

export default getCustomRepository(AccountReceivableTransactionRepository);
