import { getRepository, IsNull } from "typeorm";
import { PosShiftLogs } from "../../entities/PosShiftLog";
import { User } from "../../entities/User";
import { POSShiftLogActionSet } from "../../enumset";
import { ValidateError } from "../../middlewares/error/error-type";
import { ICreateOptions } from "../../repositories/v2/CreateRepository";
import PosRepository from "../../repositories/v2/PosRepository";
import PosShiftRepository from "../../repositories/v2/PosShiftRepository";
import UserRepository from "../../repositories/v2/UserRepository";
import { BaseController } from "./BaseController";

class PosShiftController extends BaseController {
  setLogParams = (req, res, next) => {
    req.query.posShiftId = req.params.id;

    next();
  };

  canOpen = async (req, res, next) => {
    const { onDutymanagerId, posPinCode } = req.body;

    try {
      const pos = await PosRepository.findOne(
        { id: req.params.id },
        { relations: ["manager"] }
      );

      req.body.isPosManager = pos.managerId === onDutymanagerId ? true : false;

      if (!req.body.isPosManager) {
        req.body.prevPosManager = pos.manager;
      }

      const manager = await getRepository(User).findOne({
        where: {
          id: onDutymanagerId,
          posPinCode
        }
      });

      if (!manager) {
        return next(
          new ValidateError({
            name: "ไม่สามารถเปิดรอบการรับชำระเงินได้",
            message:
              "รหัสผ่านสำหรับใช้งานจุดรับชำระ (POS Pincode) ของผู้อนุมัติไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
          })
        );
      }

      req.body.newPosManager = manager;

      const openShift = await PosShiftRepository.findOne({
        posId: req.params.id,
        endedShift: IsNull()
      });

      if (openShift) {
        return next(
          new ValidateError({
            name: "ไม่สามารถเปิดรอบการรับชำระเงินได้",
            message: "มีรอบการรับชำระเงินที่ยังไม่ถูกปิด"
          })
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };

  createPosShift = (options?: ICreateOptions) => {
    return async (req, res, next) => {
      const {
        onDutymanagerId,
        startedShift,
        openingAmount,
        isPosManager,
        prevPosManager,
        newPosManager
      } = req.body;
      try {
        const shift = PosShiftRepository.create({
          posId: req.params.id,
          currentCashierId: req.user.id,
          onDutymanagerId,
          startedShift,
          openingAmount,
          expectedDrawerAmount: openingAmount
        });

        const swapManagerLog =
          !isPosManager &&
          getRepository(PosShiftLogs).create({
            action: POSShiftLogActionSet.swap_manager,
            transactionAmount: 0,
            expectedDrawerAmount: shift.openingAmount,
            note: `เปลี่ยนผู้ดูแลจุดรับชำระจาก ${prevPosManager.title}${prevPosManager.firstname} ${prevPosManager.lastname} เป็น ${newPosManager.title}${newPosManager.firstname} ${newPosManager.lastname}`,
            // createdBy: req.body.createdBy,
            // createdByName: req.body.createdByName
            createdBy: newPosManager.id,
            createdByName: `${newPosManager.title}${newPosManager.firstname} ${newPosManager.lastname}`
          });

        const log = getRepository(PosShiftLogs).create({
          transactionAmount: shift.openingAmount,
          expectedDrawerAmount: shift.openingAmount,
          action: POSShiftLogActionSet.open,
          // createdBy: req.body.createdBy,
          // createdByName: req.body.createdByName
          createdBy: newPosManager.id,
          createdByName: `${newPosManager.title}${newPosManager.firstname} ${newPosManager.lastname}`
        });

        const entity = await PosShiftRepository.createPosShift(
          shift,
          log,
          swapManagerLog
        );

        res.locals.data = entity;

        next();
      } catch (err) {
        err.message = `ไม่สามารถสร้างข้อมูล${this.entityInfo} ${err.message}`;
        next(err);
      }
    };
  };

  updatePosShift = async (req, res, next) => {
    const { action, note, pin, newPosManager, ...rest } = req.body;

    const log = getRepository(PosShiftLogs).create({});

    try {
      const shift = await PosShiftRepository.findOne({
        where: { id: req.params.id }
      });

      log.posShiftId = shift.id;
      log.createdBy = req.body.updatedBy;
      log.createdByName = req.body.updatedByName;

      switch (action) {
        case POSShiftLogActionSet.close:
          if (!req.body.endedShift) {
            return next(
              new ValidateError({
                name: `ไม่สามารถปิดรอบการรับชำระได้`,
                message: `ไม่พบเวลาที่ปิดรอบการรับชำระ`
              })
            );
          }
          log.action = POSShiftLogActionSet.close;
          log.transactionAmount = rest.drawerAmount;
          // log.expectedDrawerAmount = shift.expectedDrawerAmount;
          log.expectedDrawerAmount = req.body.drawerAmount;
          log.createdBy = newPosManager.id;
          log.createdByName = `${newPosManager.title}${newPosManager.firstname} ${newPosManager.lastname}`;
          break;
        case POSShiftLogActionSet.swap_manager:
          log.action = POSShiftLogActionSet.swap_manager;
          log.transactionAmount = 0;
          log.expectedDrawerAmount = shift.expectedDrawerAmount;
          log.note = note;
          log.createdBy = newPosManager.id;
          log.createdByName = `${newPosManager.title}${newPosManager.firstname} ${newPosManager.lastname}`;
          break;
        case POSShiftLogActionSet.cashier_logout:
          shift.currentCashierId = null;
          log.action = POSShiftLogActionSet.cashier_logout;
          log.transactionAmount = 0;
          log.expectedDrawerAmount = shift.expectedDrawerAmount;
          break;
        case POSShiftLogActionSet.add_cash:
          log.action = POSShiftLogActionSet.add_cash;
          shift.expectedDrawerAmount =
            +shift.expectedDrawerAmount + +rest.transactionAmount;
          log.transactionAmount = rest.transactionAmount;
          log.expectedDrawerAmount = shift.expectedDrawerAmount;
          log.note = note;
          break;
        case POSShiftLogActionSet.drop_cash:
          log.action = POSShiftLogActionSet.drop_cash;
          shift.expectedDrawerAmount =
            +shift.expectedDrawerAmount - +rest.transactionAmount;
          log.transactionAmount = rest.transactionAmount;
          log.expectedDrawerAmount = shift.expectedDrawerAmount;
          log.note = note;
          break;
        // case POSShiftLogActionSet.swap_cashier:
        //   break;
        // case POSShiftLogActionSet.count_cash:
        //   break;
      }

      PosShiftRepository.merge(shift, rest);

      await PosShiftRepository.updatePosShift(shift, log);

      next();
    } catch (err) {
      next(err);
    }
  };

  getCalculateFieldShift = async (req, res, next) => {
    try {
      const rawData = await PosShiftRepository.getCalculateFieldShift(
        req.params.id
      );

      res.locals.data = { ...res.locals.data, ...rawData };

      next();
    } catch (err) {
      next(err);
    }
  };
}

export const controller = new PosShiftController(
  "PosShift",
  "รอบการรับชำระเงิน"
);
