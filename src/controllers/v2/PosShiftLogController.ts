import { BaseController } from "./BaseController";

class PosShiftLogController extends BaseController {}

export const controller = new PosShiftLogController(
  "PosShiftLogs",
  "บันทึกรอบการรับชำระเงิน"
);
