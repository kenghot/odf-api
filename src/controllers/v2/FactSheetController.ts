import { BaseController } from "./BaseController";

class FactSheetController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }
}

export const controller = new FactSheetController(
  "RequestFactSheet",
  "แบบสอบข้อเท็จจริง"
);
