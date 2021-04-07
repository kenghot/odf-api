import { OccupationRepository } from "../../repositories/v1";
import { BaseController } from "./base_controller";

class OccupationController extends BaseController {}

export const controller = new OccupationController(OccupationRepository);
