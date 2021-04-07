import { RequestHandler } from "express";

// import { enum_set } from "../../config-data/enum_set";
import * as enum_set from "../../../config-data/enum_set.json";
import * as fact_sheet from "../../../config-data/fact_sheet.json";
import * as guarantor_borrower_relationship from "../../../config-data/guarantor-borrower-relationship.json";
import * as marriage_status from "../../../config-data/marriage-status.json";
import * as request_validation_checklist from "../../../config-data/request_validation_checklist.json";
import * as residence_status from "../../../config-data/residence-status.json";
import * as residence_type from "../../../config-data/residence-type.json";

const configData = {
  marriage_status,
  residence_status,
  residence_type,
  guarantor_borrower_relationship,
  request_validation_checklist,
  fact_sheet,
  enum_set
};

export class ConfigController {
  static getConfigData = (type?: string): RequestHandler => {
    switch (type) {
      case "json":
        return ConfigController.getJsonData;
      default:
        return ConfigController.getData;
    }
  };

  private static getJsonData = (req, res, next) => {
    try {
      const key = req.url.slice(1);
      res.send({ data: configData[key], success: true });
    } catch (e) {
      next(e);
    }
  };

  private static getData = (req, res, next) => {
    try {
      const key = req.url.slice(1);
      res.send({ data: configData[key], success: true });
    } catch (e) {
      next(e);
    }
  };
}
