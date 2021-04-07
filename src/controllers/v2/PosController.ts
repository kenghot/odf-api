import { getManager, getRepository } from "typeorm";
import { Pos } from "../../entities/Pos";
import { PosShift } from "../../entities/PosShift";
import { PosShiftLogs } from "../../entities/PosShiftLog";
import { POSShiftLogActionSet } from "../../enumset";
import { ValidateError } from "../../middlewares/error/error-type";
import PosRepository, { IPosFilter } from "../../repositories/v2/PosRepository";
import { ISearchOptions } from "../../repositories/v2/SearchRepository";
import UserRepository from "../../repositories/v2/UserRepository";
import { BaseController } from "./BaseController";

class PosController extends BaseController {
  setShiftParams = (req, res, next) => {
    req.query.posId = req.params.id;

    next();
  };

  login = async (req, res, next) => {
    const { userId, pin } = req.body;

    if (!pin) {
      return next(
        new ValidateError({
          name: "ไม่สามารถเข้าใช้งานจุดรับชำระได้",
          message: "กรุณากรอกรหัสเข้าใช้จุดรับชำระ"
        })
      );
    }

    try {
      const user = await UserRepository.findOne({
        where: {
          // id: userId,
          id: req.user.id,
          posPinCode: pin
        }
      });
      if (!user) {
        return next(
          new ValidateError({
            name: "ไม่สามารถเข้าใช้งานจุดรับชำระได้",
            message: "รหัสผ่านสำหรับจุดรับชำระไม่ถูกต้อง"
          })
        );
      }

      const entity = await getRepository(Pos)
        .createQueryBuilder("pos")
        .leftJoinAndSelect("pos.manager", "manager")
        .leftJoinAndSelect("pos.shifts", "shift", "shift.endedShift IS NULL")
        .leftJoinAndSelect("shift.currentCashier", "currentCashier")
        .leftJoinAndSelect("shift.onDutymanager", "onDutyManager")
        .where("pos.id = :posId", { posId: req.params.id })
        .orderBy("shift.createdDate", "DESC")
        .getOne();

      if (!entity) {
        return next(
          new ValidateError({
            name: "ไม่สามารถเข้าใช้งานจุดรับชำระได้",
            message: "ไม่พบจุดรับชำระที่เลือก"
          })
        );
      }

      entity.isOnline = entity.lastestPosShift ? true : false;

      // check if not currentCashierId update Shift && create ShiftLog
      if (
        entity.lastestPosShift &&
        +entity.lastestPosShift.currentCashierId !== +userId
      ) {
        const log = getRepository(PosShiftLogs).create({
          posShiftId: entity.lastestPosShift.id,
          action: POSShiftLogActionSet.cashier_login,
          transactionAmount: 0,
          // expectedDrawerAmount: entity.lastestPosShift.expectedDrawerAmount,
          createdBy: req.body.createdBy,
          createdByName: req.body.createdByName
        });
        await getManager().transaction(async (transactionEntityManager) => {
          await transactionEntityManager.update(
            PosShift,
            { id: entity.lastestPosShift.id },
            // { currentCashierId: userId }
            { currentCashierId: req.user.id }
          );
          await transactionEntityManager.save(log);
        });
      }

      // res.locals.data = entity;
      req.params.fromLogin = true;

      next();
    } catch (err) {
      next(err);
    }
  };

  getPoses = (options: ISearchOptions = {}) => {
    return async (req, res, next) => {
      const {
        posCode,
        permittedOrganizationIds,
        active,
        isOnline
      } = req.query as IPosFilter;

      const { currentPage = 1, perPage = 10 } = req.query;

      try {
        const [entities, total] = await PosRepository.findAndCountPoses(
          {
            posCode,
            permittedOrganizationIds,
            active,
            isOnline
          },
          { currentPage, perPage }
        );
        res.locals.data = entities;
        res.locals.total = total;

        next();
      } catch (err) {
        next(err);
      }
    };
  };

  getPos = (options: ISearchOptions = {}) => {
    return async (req, res, next) => {
      try {
        const entity = await PosRepository.findOnePos(
          req.params.id,
          req.params.fromLogin && true
        );

        res.locals.data = entity;

        next();
      } catch (err) {
        next(err);
      }
    };
  };

  getPosesWithReceiptControl = async (req, res, next) => {
    try {
      const [
        raw,
        count
      ] = await PosRepository.findAndCountPosesWithReceiptControl(req.query);

      res.locals.data = raw;
      res.locals.total = count;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const controller = new PosController("Pos", "จุดรับชำระ");
