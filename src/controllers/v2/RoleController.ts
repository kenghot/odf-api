import { BaseController } from "./BaseController";

class RoleController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }
}

export const controller = new RoleController("Role", "กลุ่มผู้ใช้งาน");
