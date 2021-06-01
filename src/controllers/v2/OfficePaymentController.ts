import { getRepository } from "typeorm";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { Receipt } from "../../entities/Receipt";
import {
  arTransactionStatusSet,
  officePaymentMethodSet,
  paymentMethodSet,
  paymentTypeSet,
  receiptStatusSet
} from "../../enumset";
import { ValidateError } from "../../middlewares/error/error-type";
import ReceiptRepository, {
  IReceiptPayment
} from "../../repositories/v2/ReceiptRepository";
import { PaymentService } from "../../services/PaymentService";

interface ITransaction {
  accountReceivableId: number;
  paymentType: paymentTypeSet;
  paymentId: number;
  paymentMethod: paymentMethodSet;
  paymentReferenceNo: string;
  paidDate: string | Date;
  paidAmount: number;
}

interface ICancelTransaction {
  transactionId: number;
  cancelPaymentId: number;
  paidDate: string | Date;
}

// map receipt.paymentMethod to tr.paymentMethod
const officePaymentMethod = {
  [`${officePaymentMethodSet.cash}`]: paymentMethodSet.cash,
  [`${officePaymentMethodSet.moneyOrder}`]: paymentMethodSet.moneyOrder,
  [`${officePaymentMethodSet.check}`]: paymentMethodSet.check,
  [`${officePaymentMethodSet.transfer}`]: paymentMethodSet.transfer

};

export class OfficeController {
  static officeVerifyAccount = async (req, res, next) => {
    const body = req.body as Receipt;
    const { receiptItems } = body;
    const transactions: ITransaction[] = [];

    if (!body.paidDate) {
      body.paidDate = new Date();
    }

    if (!receiptItems) {
      return next(
        new ValidateError({
          name: `ไม่สามารถทำรายการได้`,
          message: `ไม่สามารถทำรายการได้เนื่องจากไม่พบรายการที่ต้องการสร้าง`
        })
      );
    }
    try {
      for (const item of receiptItems) {
        if (item.refType === "AR") {
          const [ars, total] = await PaymentService.verifyAccount(
            item.ref1,
            item.ref2
          );
          if (!total) {
            return next(
              new ValidateError({
                name: `ไม่สามารถทำรายการได้`,
                message: `ไม่สามารถทำรายการได้เนื่องจากไม่พบข้อมูลลูกหนี้ที่เกี่ยวข้อง`
              })
            );
          } else if (total === 1) {
            // add ar.id to receiptItem.id
            item.refId = ars[0].id.toString();
            transactions.push({
              accountReceivableId: ars[0].id,
              paymentType: paymentTypeSet.office,
              paymentId: null,
              paymentMethod: officePaymentMethod[body.paymentMethod],
              paymentReferenceNo: null,
              paidDate: body.paidDate,
              paidAmount: item.subtotal
            });
          } else if (total > 1) {
            return next(
              new ValidateError({
                name: `ไม่สามารถทำรายการได้`,
                message: `ไม่สามารถทำรายการได้เนื่องจากพบข้อมูลลูกหนี้ที่เกี่ยวข้องมากกว่าหนึ่งรายการ`
              })
            );
          }
        }
      }
      req.body.transactions = transactions;
      next();
    } catch (err) {
      next(err);
    }
  };
  static officePayment = async (req, res, next) => {
    const { createdBy, createdByName } = req.body;
    const transactions = req.body.transactions as ITransaction[];
    const payments: IReceiptPayment[] = [];
    try {
      for (const transaction of transactions) {
        const {
          accountReceivableId,
          paymentType,
          paymentId,
          paymentMethod,
          paymentReferenceNo,
          paidDate,
          paidAmount
        } = transaction;
        const [
          error,
          ar,
          tr,
          collection,
          agreement
        ] = await PaymentService.createTransaction(
          accountReceivableId,
          paymentType,
          paymentId,
          paymentMethod,
          paymentReferenceNo,
          paidDate,
          paidAmount,
          true
        );
        if (error) {
          const err = new ValidateError({
            name: `ไม่สามารถทำรายการได้`
          });
          if (error === 403) {
            err.message = "ยอดคงเหลือน้อยกว่าจำนวนที่ต้องการทำรายการ";
          }
          return next(err);
        }

        ar.updatedBy = createdBy;
        ar.updatedByName = createdByName;
        tr.createdBy = createdBy;
        tr.createdByName = createdByName;
        if (collection) {
          collection.updatedBy = createdBy;
          collection.updatedByName = createdByName;
        }

        payments.push({
          accountReceivable: ar,
          transaction: tr,
          collection,
          agreement
        });
      }
      req.body.payments = payments;

      next();
    } catch (err) {
      next(err);
    }
  };
  static officeCancel = async (req, res, next) => {
    const { updatedBy, updatedByName } = req.body;
    const payments: IReceiptPayment[] = [];
    const cancelTransactions: ICancelTransaction[] = [];
    try {
      const receipt = await ReceiptRepository.findOne({
        where: { id: req.params.id, status: receiptStatusSet.paid },
        relations: ["receiptItems"]
      });

      if (!receipt) {
        return next(
          new ValidateError({
            name: `ไม่สามารถยกเลิกใบเสร็จรับเงิน`,
            message: `ไม่สามารถยกเลิกใบเสร็จรับเงินเนื่องจากไม่พบใบเสร็จที่ต้องการยกเลิก`
          })
        );
      }

      for (const item of receipt.receiptItems) {
        if (item.refType === "AR") {
          const tr = await getRepository(AccountReceivableTransaction).findOne({
            where: {
              paymentType: paymentTypeSet.office,
              paymentId: receipt.id,
              paymentMethod: receipt.paymentMethod
                ? officePaymentMethod[receipt.paymentMethod]
                : "",
              paymentReferenceNo: receipt.documentNumber,
              status: arTransactionStatusSet.normal
            }
          });

          cancelTransactions.push({
            transactionId: tr.id,
            paidDate: new Date(),
            cancelPaymentId: receipt.id
          });
        }
      }

      for (const cancel of cancelTransactions) {
        const [
          error,
          ar,
          tr,
          collection,
          agreement
        ] = await PaymentService.cancelTransaction(
          cancel.transactionId,
          cancel.cancelPaymentId,
          cancel.paidDate,
          true
        );

        if (error) {
          return next(error);
        }

        ar.updatedBy = updatedBy;
        ar.updatedByName = updatedByName;
        tr.createdBy = updatedBy;
        tr.createdByName = updatedByName;
        if (collection) {
          collection.updatedBy = updatedBy;
          collection.updatedByName = updatedByName;
        }

        // actionLog
        agreement.logUpdatedBy(req.body);

        payments.push({
          accountReceivable: ar,
          transaction: tr,
          collection,
          agreement
        });
      }

      req.body.receipt = receipt;
      req.body.payments = payments;

      // next to ReceiptController
      next();
    } catch (err) {
      next(err);
    }
  };
}
