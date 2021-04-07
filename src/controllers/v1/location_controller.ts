import { RequestHandler } from "express";

import { SearchConditionError } from "../../middlewares/error/error-type/SearchConditionError";
import {
  LocationDistrictRepository,
  LocationProvinceRepository,
  LocationSubDistrictRepository
} from "../../repositories/v1";

export class LocationController {
  static getLocationBySubDistrict: RequestHandler = async (req, res, next) => {
    const { search_keyword } = req.query;
    try {
      const [
        locations,
        total
      ] = await LocationSubDistrictRepository.findLocations(search_keyword);

      if (!total) {
        return next(
          new SearchConditionError({
            message: "cannot find this location"
          })
        );
      }

      res.send({ data: locations, success: true });
    } catch (e) {
      next(e);
    }
  };

  static getLocationByDistrict: RequestHandler = async (req, res, next) => {
    const { search_keyword } = req.query;
    try {
      const [locations, total] = await LocationDistrictRepository.findLocations(
        search_keyword
      );

      if (!total) {
        return next(
          new SearchConditionError({
            message: "cannot find this location"
          })
        );
      }

      res.send({ data: locations, success: true });
    } catch (e) {
      next(e);
    }
  };

  static getLocationByProvince: RequestHandler = async (req, res, next) => {
    const { search_keyword } = req.query;
    try {
      const [locations, total] = await LocationProvinceRepository.findLocations(
        search_keyword,
        true
      );

      if (!total) {
        return next(
          new SearchConditionError({
            message: "cannot find this location"
          })
        );
      }

      res.send({ data: locations, success: true });
    } catch (e) {
      next(e);
    }
  };
}
