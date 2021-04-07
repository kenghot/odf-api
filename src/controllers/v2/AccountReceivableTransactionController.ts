import { BaseController } from "./BaseController";

class AccountReceivableTransactionController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }
}

export const controller = new AccountReceivableTransactionController(
  "AccountReceivableTransaction",
  "รายการเคลื่อนไหวลูกหนี้"
);
