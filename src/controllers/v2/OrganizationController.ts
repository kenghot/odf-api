import { BaseController } from "./BaseController";

class OrganizationController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }
}

export const controller = new OrganizationController(
  "Organization",
  "หน่วยงาน"
);
