import { DeepPartial, getRepository } from "typeorm";
import { PosShiftLogs } from "../../entities/PosShiftLog";
import { Receipt } from "../../entities/Receipt";
import { ReceiptSequence } from "../../entities/ReceiptSequence";
import { User } from "../../entities/User";
import { POSShiftLogActionSet, receiptStatusSet } from "../../enumset";
import { ValidateError } from "../../middlewares/error/error-type";
import PosShiftRepository from "../../repositories/v2/PosShiftRepository";
import ReceiptRepository, {
  IReceiptPayment
} from "../../repositories/v2/ReceiptRepository";
import { getFiscalYear } from "../../utils/datetime-helper";
import { BaseController } from "./BaseController";

interface ICancelReceipt {
  payments: IReceiptPayment[];
  receipt: Receipt;
  newPosManager: User;
  updatedBy: number;
  updatedByName: string;
}

class ReceiptController extends BaseController {
  getReceipt = async (req, res, next) => {
    try {
      const receipt = await ReceiptRepository.findReceipt(req.params.id);

      res.locals.data = receipt;
      next();
    } catch (err) {
      next(err);
    }
  };

  createReceipt = async (req, res, next) => {
    const { payments, ...rest } = req.body;
    const receipt: DeepPartial<Receipt> = rest;

    const [err, message] = this.validateCreateBody(receipt);

    if (err) {
      return next(
        new ValidateError({
          name: `ไม่สามารถสร้างเอกสาร${this.entityInfo}`,
          message: `ไม่สามารถสร้างเอกสาร${this.entityInfo} ${message}`
        })
      );
    }

    try {
      const shift = await PosShiftRepository.findOne({
        relations: ["pos", "pos.receiptSequence", "onDutymanager"],
        where: { id: receipt.posShiftId }
      });

      // tslint:disable-next-line: no-shadowed-variable
      const [err, message, fiscalYear] = this.validateDocSequence(
        shift.pos.receiptSequence,
        receipt.documentDate as Date
      );

      if (err) {
        return next(
          new ValidateError({
            name: `ไม่สามารถสร้างเอกสาร${this.entityInfo}`,
            message: `ไม่สามารถสร้างเอกสาร${this.entityInfo} ${message}`
          })
        );
      }

      shift.expectedDrawerAmount = +shift.expectedDrawerAmount + +receipt.total;

      const log = getRepository(PosShiftLogs).create({
        transactionAmount: receipt.total,
        expectedDrawerAmount: shift.expectedDrawerAmount,
        action: POSShiftLogActionSet.add_cash,
        posShiftId: shift.id,
        refType: "RECEIPT",
        createdBy: req.body.createdBy,
        createdByName: req.body.createdByName
      });

      receipt.status = receiptStatusSet.paid;
      receipt.paidDate = req.body.paidDate;
      receipt.recieveBy = shift.onDutymanagerId;
      receipt.recieveByName = shift.onDutymanager.fullname;
      receipt.recieveByPosition = shift.onDutymanager.position;
      receipt.documentDate = req.body.documentDate;

      const entity = await ReceiptRepository.createReceipt(
        ReceiptRepository.create(receipt),
        shift.pos.receiptSequence,
        payments,
        shift,
        log
      );

      res.locals.data = entity;

      next();
    } catch (err) {
      err.message = `ไม่สามารถสร้างเอกสาร${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  cancelReceipt = async (req, res, next) => {
    const {
      payments,
      receipt,
      newPosManager,
      updatedBy,
      updatedByName
    } = req.body as ICancelReceipt;

    receipt.documentNote = req.body.documentNote;
    receipt.status = receiptStatusSet.cancel;
    receipt.cancelApprovedManagerId = newPosManager.id;
    receipt.cancelApprovedManagerName = newPosManager.fullname;
    receipt.cancelApprovedManagerPosition = newPosManager.position;

    try {
      const shift = await PosShiftRepository.findOne({
        where: { id: receipt.posShiftId }
      });

      shift.expectedDrawerAmount = +shift.expectedDrawerAmount - +receipt.total;

      const log = getRepository(PosShiftLogs).create({
        transactionAmount: receipt.total,
        expectedDrawerAmount: shift.expectedDrawerAmount,
        action: POSShiftLogActionSet.drop_cash,
        posShiftId: shift.id,
        refType: "RECEIPT",
        createdBy: updatedBy,
        createdByName: updatedByName
      });

      // actionLog
      receipt.logUpdatedBy(req.body);
      shift.logUpdatedBy(req.body);

      const entity = await ReceiptRepository.cancelReceipt(
        receipt,
        payments,
        shift,
        log
      );

      res.locals.data = entity;

      next();
    } catch (err) {
      next(err);
    }
  };

  private validateCreateBody = (
    receipt: DeepPartial<Receipt>
  ): [boolean, string] => {
    const { documentDate } = receipt;

    return [null, ""];
  };

  private validateDocSequence = (
    sequence: ReceiptSequence,
    date: Date
  ): [boolean, string, number?] => {
    if (!sequence) {
      return [
        true,
        "จุดรับชำระที่ทำการสร้างใบเสร็จรับเงินยังไม่ได้ตั้งค่าเลขที่เอกสารใบเสร็จรับเงิน กรุณาติดต่อผู้ดูแลระบบ"
      ];
    }

    const fiscalYear = getFiscalYear(date);

    if (fiscalYear !== +sequence.prefixYear) {
      return [
        true,
        "ตัวจัดการเลขที่เอกสารปัจจุบันไม่ตรงกับปีงบประมาณ กรุณาติดต่อผู้ดูแลระบบ"
      ];
    }

    return [null, "", fiscalYear];
  };
}

export const controller = new ReceiptController("Receipt", "ใบเสร็จรับเงิน");
