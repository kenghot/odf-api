import { getRepository, IsNull } from "typeorm";
import { User } from "../entities/User";
import { POSShiftLogActionSet } from "../enumset";
import PosShiftRepository from "../repositories/v2/PosShiftRepository";
import { AuthError, ValidateError } from "./error/error-type";
import { PosAuthError } from "./error/error-type/pos-auth-error";

export const posAuth = async (req, res, next) => {
  const fromPos = req.method === "GET" ? req.query.fromPos : req.body.fromPos;
  const posShiftId =
    req.method === "GET" ? req.query.posShiftId : req.body.posShiftId;

  if (!fromPos) {
    return next();
  }

  try {
    const shift = await PosShiftRepository.findOne({
      where: {
        id: posShiftId,
        endedShift: IsNull(),
        currentCashierId: req.user.id
      }
    });

    if (!shift) {
      return next(
        new PosAuthError({
          name: "ไม่สามารถเข้าใช้งานจุดรับชำระได้",
          message: "กรุณาเช้าสู่ระบบรับชำระก่อนเริ่มใช้งาน"
        })
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const isPosManager = async (req, res, next) => {
  const isBypass = [
    POSShiftLogActionSet.add_cash,
    POSShiftLogActionSet.drop_cash,
    POSShiftLogActionSet.cashier_logout
  ].includes(req.body.action);

  if (isBypass) {
    return next();
  }

  try {
    const manager = await getRepository(User).findOne({
      where: {
        id: req.body.onDutymanagerId,
        posPinCode: req.body.pin
      }
    });

    if (!manager) {
      return next(
        new ValidateError({
          name: "ไม่สามารถทำรายการได้",
          // message: "รหัสผู้ดูแลหรือรหัสผ่านสำหรับผู้ดูแลจุดรับชำระไม่ถูกต้อง"
          message:
            "รหัสผ่านสำหรับใช้งานจุดรับชำระ (POS Pincode) ของผู้อนุมัติไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
        })
      );
    }

    req.body.newPosManager = manager;

    next();
  } catch (err) {
    next(err);
  }
};
