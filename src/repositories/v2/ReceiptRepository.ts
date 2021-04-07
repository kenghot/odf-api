import {
  EntityRepository,
  getCustomRepository,
  getManager,
  getRepository,
  Repository,
} from "typeorm";

import { AccountReceivable } from "../../entities/AccountReceivable";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { Agreement } from "../../entities/Agreement";
import { DebtCollection } from "../../entities/DebtCollection";
import { DonationAllowance } from "../../entities/DonationAllowance";
import { DonationDirect } from "../../entities/DonationDirect";
import { PosShift } from "../../entities/PosShift";
import { PosShiftLogs } from "../../entities/PosShiftLog";
import { Receipt } from "../../entities/Receipt";
import { ReceiptPrintLog } from "../../entities/ReceiptPrintLog";
import { ReceiptSequence } from "../../entities/ReceiptSequence";
import { debtInterruptReasonSet } from "../../enumset";
import { DBError } from "../../middlewares/error/error-type";
import { getEnumSetText } from "../../utils/get-enum-set-text";

export interface IReceiptPayment {
  accountReceivable: AccountReceivable;
  transaction: AccountReceivableTransaction;
  collection: DebtCollection;
  agreement: Agreement;
}

@EntityRepository(Receipt)
class ReceiptRepository extends Repository<Receipt> {
  async createReceipt(
    receipt: Receipt,
    receiptSequence: ReceiptSequence,
    payments: IReceiptPayment[],
    shift: PosShift,
    log: PosShiftLogs
  ): Promise<Receipt> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          const updateResult = await transactionEntityManager
            .createQueryBuilder()
            .update(ReceiptSequence)
            .set({ sequenceNumber: () => "sequenceNumber + 1" })
            .whereEntity(receiptSequence)
            .execute();

          const updatedSequence = await transactionEntityManager.findOne(
            ReceiptSequence,
            {
              id: receiptSequence.id,
              updatedDate: updateResult.generatedMaps[0].updatedDate,
            }
          );

          receipt.documentNumber = updatedSequence.runningNumber;
          receipt.clientName = `${receipt.clientTitle}${receipt.clientFirstname} ${receipt.clientLastname}`;

          await transactionEntityManager.save(receipt);
          for (const item of receipt.receiptItems) {
            if (item.refType === "D") {
              const donation = getRepository(DonationDirect).create({
                // donationDate: receipt.documentDate,
                donationDate: item.ref3,
                receiptDate: receipt.documentDate,
                receiptId: receipt.id,
                name: getEnumSetText("donationType", item.ref1),
                organizationId: receipt.organizationId,
                donatorName: receipt.clientName,
                donatorAddress: receipt.clientAddress,
                deliveryAddress: receipt.clientAddress,
                note: receipt.documentNote,
                createdBy: receipt.createdBy,
                createdByName: receipt.createdByName,
                paidAmount: item.subtotal,
                donatorFirstname: receipt.clientFirstname,
                donatorLastname: receipt.clientLastname,
                donatorTitle: receipt.clientTitle,
                donatorIdCardNo: receipt.clientTaxNumber,
              });
              await transactionEntityManager.save(donation);
            }
          }
          for (const payment of payments) {
            const {
              accountReceivable,
              transaction,
              collection,
              agreement,
            } = payment;
            transaction.paymentId = receipt.id;
            transaction.paymentReferenceNo = receipt.documentNumber;
            await transactionEntityManager.save(transaction, {
              listeners: false,
            });
            await transactionEntityManager.save(accountReceivable, {
              listeners: false,
            });
            if (collection) {
              collection.interruptData(
                debtInterruptReasonSet.paid,
                "ACCOUNT_RECEIVABLE_TRANSACTION",
                transaction.id
              );
              await transactionEntityManager.save(collection, {
                listeners: false,
              });
            }
            await transactionEntityManager.save(agreement);
          }
          await transactionEntityManager.save(shift);
          log.refId = receipt.id;
          log.note = receipt.documentNumber;
          await transactionEntityManager.save(log);
        } catch (e) {
          throw e;
        }
      });

      return receipt;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
  async cancelReceipt(
    receipt: Receipt,
    payments: IReceiptPayment[],
    shift: PosShift,
    log: PosShiftLogs
  ) {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        await transactionEntityManager.save(receipt);
        for (const payment of payments) {
          const {
            accountReceivable,
            transaction,
            collection,
            agreement,
          } = payment;
          await transactionEntityManager.save(transaction, {
            listeners: false,
          });
          await transactionEntityManager.save(accountReceivable, {
            listeners: false,
          });
          if (collection) {
            await transactionEntityManager.save(collection, {
              listeners: false,
            });
          }
          await transactionEntityManager.save(agreement);
        }
        await transactionEntityManager.save(shift);
        log.refId = receipt.id;
        log.note = receipt.documentNumber;
        await transactionEntityManager.save(log);
      });

      return receipt;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async findReceipt(id: number) {
    const queryBuilder = this.createQueryBuilder("receipt")
      .leftJoinAndSelect("receipt.organization", "organization")
      .leftJoinAndSelect("receipt.receiptItems", "receiptItem")
      .leftJoinAndSelect("receipt.receiptPrintLogs", "log");

    queryBuilder.addSelect((qb) => {
      return qb
        .select("IFNULL(COUNT(log.id), 0)")
        .from(ReceiptPrintLog, "log")
        .where("log.receiptId = receipt.id");
    }, "printCount");

    queryBuilder.where("receipt.id = :id", { id });
    queryBuilder.orderBy("log.printedDatetime", "ASC");

    try {
      const { entities, raw } = await queryBuilder.getRawAndEntities();
      const receipt = entities[0];
      receipt.printCount = raw[0].printCount;
      return receipt;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }
  async createDonationAllowanceReceipt(
    receipt: Receipt,
    donation: DonationAllowance | DonationDirect,
    receiptSequence: ReceiptSequence,
    shift: PosShift,
    log: PosShiftLogs
  ): Promise<Receipt> {
    try {
      await getManager().transaction(async (transactionEntityManager) => {
        try {
          const updateResult = await transactionEntityManager
            .createQueryBuilder()
            .update(ReceiptSequence)
            .set({ sequenceNumber: () => "sequenceNumber + 1" })
            .whereEntity(receiptSequence)
            .execute();

          const updatedSequence = await transactionEntityManager.findOne(
            ReceiptSequence,
            {
              id: receiptSequence.id,
              updatedDate: updateResult.generatedMaps[0].updatedDate,
            }
          );

          receipt.documentNumber = updatedSequence.runningNumber;

          await transactionEntityManager.save(receipt);
          // donation.paymentId = receipt.id;
          // donation.paymentReferenceNo = receipt.documentNumber;
          donation.receiptId = receipt.id;
          await transactionEntityManager.save(donation);

          if (shift) {
            await transactionEntityManager.save(shift);
          }
          if (log) {
            log.refId = receipt.id;
            log.note = receipt.documentNumber;
            await transactionEntityManager.save(log);
          }
        } catch (e) {
          throw e;
        }
      });

      return receipt;
    } catch (e) {
      throw new DBError({ message: e.message });
    }
  }
}

export default getCustomRepository(ReceiptRepository);
