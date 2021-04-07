import { Router } from "express";
import { ConfigController } from "../controllers/v1/config_controller";
import { LocationController } from "../controllers/v1/location_controller";
import { interestCalculate } from "../middlewares/interest-calculate";
import { onSuccess } from "../middlewares/success-handler";

export const configRouter = Router();

configRouter.get("/marriage_status", ConfigController.getConfigData("json"));
configRouter.get("/residence_type", ConfigController.getConfigData("json"));
configRouter.get("/residence_status", ConfigController.getConfigData("json"));
configRouter.get(
  "/guarantor_borrower_relationship",
  ConfigController.getConfigData("json")
);
configRouter.get(
  "/request_validation_checklist",
  ConfigController.getConfigData("json")
);
configRouter.get("/fact_sheet", ConfigController.getConfigData("json"));
configRouter.get("/enum_set", ConfigController.getConfigData("json"));
configRouter.get("/sub_districts", LocationController.getLocationBySubDistrict);
configRouter.get("/districts", LocationController.getLocationByDistrict);
configRouter.get("/provinces", LocationController.getLocationByProvince);
configRouter.get("/interest_calculate", interestCalculate, onSuccess());
