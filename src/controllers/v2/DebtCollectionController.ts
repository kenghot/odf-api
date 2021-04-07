import { accountReceiviableStatusSet } from "../../enumset";
import { ValidateError } from "../../middlewares/error/error-type";
import AccountReceivableRepository from "../../repositories/v2/AccountReceivableRepository";
import DebtCollectionRepository from "../../repositories/v2/DebtCollectionRepository";
import { flattenObject } from "../../utils/object-helper";
import { BaseController } from "./BaseController";

class DebtCollectionController extends BaseController {
  constructor(entityClass: string, entityInfo) {
    super(entityClass, entityInfo);
  }

  getDebtCollection = async (req, res, next) => {
    try {
      const entity = await DebtCollectionRepository.findDebtCollection(
        req.params.id,
        {
          relations: [
            "accountReceivable",
            "accountReceivable.organization",
            "accountReceivable.controls",
            "accountReceivable.agreement",
            "accountReceivable.agreement.agreementItems",
            "accountReceivable.guarantee",
            "accountReceivable.guarantee.guaranteeItems",
            "letters",
            "visits"
          ]
        }
      );

      res.locals.data = entity;

      next();
    } catch (err) {
      next(err);
    }
  };

  canCreate = async (req, res, next) => {
    const { id, accountReceivableId } = req.body;

    if (id) {
      return next(
        new ValidateError({
          name: `ไม่สามารถสร้างข้อมูล${this.entityInfo}`,
          message: `ไม่สามารถสร้างข้อมูล${this.entityInfo}ที่ต้องการเนื่องจาก${this.entityInfo}ถูกสร้างไปแล้ว`
        })
      );
    }

    try {
      const accountReceivable = await AccountReceivableRepository.findOne({
        id: accountReceivableId
        // status: accountReceiviableStatusSet.unpaid
      });

      if (!accountReceivable) {
        return next(
          new ValidateError({
            name: `ไม่สามารถสร้างข้อมูล${this.entityInfo}`,
            message: `ไม่สามารถสร้างข้อมูล${this.entityInfo}ที่ต้องการเนื่องจากไม่พบลูกหนี้ที่เกี่ยวข้อง`
          })
        );
      }

      req.body.active = true;

      const debtCollection = await DebtCollectionRepository.findOne({
        active: true,
        accountReceivableId
      });

      if (debtCollection) {
        return next(
          new ValidateError({
            name: `ไม่สามารถสร้างข้อมูล${this.entityInfo}`,
            message: `ไม่สามารถสร้างข้อมูล${this.entityInfo}ที่ต้องการเนื่องจากลูกหนี้รายนี้มีสถานะถูกติดตามอยู่แล้ว`
          })
        );
      }

      // req.body.prescriptionStartDate = accountReceivable.lastPaymentDate;

      next();
    } catch (err) {
      err.message = `ไม่สามารถสร้างข้อมูล${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  withFormData = (req, res, next) => {
    if (req.body.debtSue) {
      req.body.debtSue.isApprovedSue = req.body.debtSue.isApprovedSue
        ? true
        : false;
    }
    if (req.body.deathNotification) {
      req.body.deathNotification.isConfirm = req.body.deathNotification
        .isConfirm
        ? true
        : false;
      if (req.body.deathNotification.isConfirm) {
        req.body.prescriptionStartDate =
          req.body.deathNotification.notificationDate;
      }
    }

    next();
  };

  updateDebtCollection = async (req, res, next) => {
    try {
      const atfs: any[] = [];
      flattenObject(req.body, "attachedFiles", true, atfs);

      const debtCollection = await DebtCollectionRepository.createQueryBuilder(
        "debtCollection"
      )
        .leftJoinAndSelect(
          "debtCollection.accountReceivable",
          "accountReceivable"
        )
        .leftJoinAndSelect("debtCollection.letters", "letter")
        .leftJoinAndSelect("debtCollection.visits", "visit")
        .where("debtCollection.id = :id", { id: req.params.id })
        .getOne();

      const oldStep = debtCollection.step;
      const oldDeathIsConfirm = debtCollection.deathNotification.isConfirm;

      DebtCollectionRepository.merge(debtCollection, req.body);

      if (debtCollection.debtSue.submitDate) {
        debtCollection.step = 3;
        debtCollection.accountReceivable.status =
          accountReceiviableStatusSet.collection;
      }

      if (!oldDeathIsConfirm && oldStep !== 0) {
        debtCollection.step = 0;
      }

      // actionLog
      debtCollection.logUpdatedBy(req.body);

      await DebtCollectionRepository.updateDebtCollection(debtCollection, atfs);

      next();
    } catch (err) {
      next(err);
    }
  };
}

export const controller = new DebtCollectionController(
  "DebtCollection",
  "การติดตามหนี้สิน"
);
