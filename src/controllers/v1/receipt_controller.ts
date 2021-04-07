import { ReceiptRepository } from "../../repositories/v1";
import { BaseController } from "./base_controller";

class ReceiptController extends BaseController {}

export const controller = new ReceiptController(ReceiptRepository);
