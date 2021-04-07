import {
  accountReceiviableStatusSet,
  arTransactionStatusSet,
  paymentTypeSet,
  paymentMethodSet
} from "../../enumset";
import { AccountReceivable } from "../../entities/AccountReceivable";
import AccountReceivableRepository from "../../repositories/v2/AccountReceivableRepository";
import AccountReceivableTransactionRepository from "../../repositories/v2/AccountReceivableTransactionRepository";
import { DeepPartial, TransactionRepository } from "typeorm";
import { AccountReceivableTransaction } from "../../entities/AccountReceivableTransaction";
import { DebtCollection } from "../../entities/DebtCollection";
import { Agreement } from "../../entities/Agreement";
import { PaymentService } from "../../services/PaymentService";
import {
  PaymentError,
  errorPaymentMessage
} from "../../middlewares/error/error-type/payment-error";
import { PaymentDuplicateError } from "../../middlewares/error/error-type/payment-duplicate-error";

interface IVerifyAccountReq {
  idCardNo: string;
  agreementId: string;
}
interface IConfirmPaymentReq {
  accountReceivableId: string;
  paidAmount: number;
  paymentReferenceNo: string;
  paymentType: paymentTypeSet;
  paymentId: number;
  paymentMethod: paymentMethodSet;
  paidDate: string | Date;
  notExecute?: boolean;
}
interface IVerifyCancelPaymentReq {
  paymentReferenceNo: string;
  paymentType: paymentTypeSet;
}
interface IConfirmCancelPaymentReq {
  transactionId: string;
  cancelPaymentId: number;
  paidDate: string | Date;
  notExecute?: boolean;
}
interface PaymentResponseData {
  accountReceivable: AccountReceivable;
  newTransaction: AccountReceivableTransaction;
}

interface IVerifyAccountRes {
  accountReceivableList: AccountReceivable[];
  total: number;
}

export class PaymentController {
  static async verifyAccount(req, res, next) {
    const reqBody = req.query as IVerifyAccountReq;
    const { idCardNo, agreementId } = reqBody;

    try {
      const [
        accountReceivableList = [],
        total = 0
      ] = await PaymentService.verifyAccount(idCardNo, agreementId);

      const resp: IVerifyAccountRes = {
        accountReceivableList,
        total
      };

      res.locals.data = resp;

      next();
    } catch (err) {
      next(err);
    }
  }

  static async confirmPayment(req, res, next) {
    const {
      accountReceivableId,
      paidAmount,
      paymentReferenceNo,
      paymentType,
      paymentId,
      paymentMethod,
      paidDate,
      notExecute
    } = req.body as IConfirmPaymentReq;

    try {
      const [
        error,
        accountReceivable,
        transaction,
        collection,
        agreement
      ] = await PaymentService.createTransaction(
        +accountReceivableId,
        paymentType,
        paymentId,
        paymentMethod,
        paymentReferenceNo,
        paidDate,
        paidAmount
      );

      if (error === 403) {
        // check if newOutstandingDebtBalance < 0
        return next(
          new PaymentError({
            message: errorPaymentMessage[403]
          })
        );
      } else if (error === 404) {
        // check if it already been done
        return next(
          new PaymentDuplicateError({
            message: errorPaymentMessage[404]
          })
        );
      }

      // prepare data before return response if everything OK
      const data: PaymentResponseData = {
        accountReceivable,
        newTransaction: transaction
      };

      res.locals.data = data;

      next();
    } catch (err) {
      next(err);
    }
  }

  static async verifyCancelPayment(req, res, next) {
    const {
      paymentReferenceNo,
      paymentType
    } = req.query as IVerifyCancelPaymentReq;
    try {
      const [
        transactions,
        total
      ] = await AccountReceivableTransactionRepository.findTransactionToCancel({
        paymentReferenceNo,
        paymentType
      });

      res.locals.data = { transactions, total };

      next();
    } catch (err) {
      next(err);
    }
  }

  static async confirmCancelPayment(req, res, next) {
    const {
      transactionId,
      cancelPaymentId,
      paidDate
    } = req.body as IConfirmCancelPaymentReq;

    try {
      const [
        error,
        accountReceivable,
        transaction,
        collection,
        agreement
      ] = await PaymentService.cancelTransaction(
        +transactionId,
        cancelPaymentId,
        paidDate
      );

      if (error === 404) {
        // if no transaction that status === NM
        return next(
          new PaymentError({
            message: errorPaymentMessage[404]
          })
        );
      }

      const data: PaymentResponseData = {
        accountReceivable,
        newTransaction: transaction
      };

      res.locals.data = data;

      next();
    } catch (err) {
      next(err);
    }
  }
}
