import { BaseController } from "./BaseController";

class OccupationController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }
}

export const controller = new OccupationController("Occupation", "อาชีพ");
