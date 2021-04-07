import { RequestHandler } from "express";

import { NotFoundError } from "../../middlewares/error/error-type";
import { OrganizationRepository } from "../../repositories/v1";
import { BaseController, IGetOptions } from "./base_controller";

class OrganizationController extends BaseController {
  getMany = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      try {
        const [
          entities,
          total
        ] = await OrganizationRepository.findOrganizations(
          req.query,
          options.relations
        );

        if (!total) {
          // return next(
          //   new NotFoundError({
          //     name: "ไม่พบข้อมูลหน่วยงาน",
          //     message: "ไม่พบข้อมูลหน่วยงานที่เกี่ยวข้อง"
          //   })
          // );
          next();
        }

        res.locals.data = entities;
        res.locals.total = total;
        next();
      } catch (e) {
        next(e);
      }
    };
  };

  // update: RequestHandler = async (req, res, next) => {
  //     try {
  //         const organization = await OrganizationRepository.updateOrganization(
  //             req.params.id,
  //             req.body
  //         );
  //         res.send({ data: organization });
  //     } catch (e) {
  //         next(e);
  //     }
  // };
}

export const controller = new OrganizationController(OrganizationRepository);
