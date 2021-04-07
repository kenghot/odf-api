import { RequestHandler } from "express";

import { DeepPartial } from "typeorm";
import { AccountReceivable } from "../../entities/AccountReceivable";
import { NotFoundError, ValidateError } from "../../middlewares/error/error-type";
import { AccountReceivableRepository } from "../../repositories/v1";
import { IARQuery } from "../../repositories/v1/account_receivable_repository";
import { BaseController, IGetOptions } from "./base_controller";

class AccountReceivableController extends BaseController {
  getMany = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      const query: IARQuery = req.query;

      try {
        const [
          entities,
          total
        ] = await AccountReceivableRepository.findAccountReceivables(
          query,
          options
        );

        if (!total) {
          // return next(
          //   new NotFoundError({
          //     name: "ไม่พบรายการข้อมูลบัญชีลูกหนี้",
          //     message: "ไม่พบรายการข้อมูลบัญชีลูกหนี้"
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

  create: RequestHandler = async (req, res, next) => {
    const accountReceivable = req.body as DeepPartial<AccountReceivable>;

    try {
      if (!accountReceivable.organization) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างลูกหนี้เงินกู้ได้",
            message: "กรุณาระบุหน่วยงานทำการสร้างลูกหนี้เงินกู้"
          })
        );
      }

      if (!accountReceivable.documentDate) {
        return next(
          new ValidateError({
            name: "ไม่สามารถสร้างลูกหนี้เงินกู้ได้",
            message: "กรุณาระบุวันที่ที่ต้องการสร้างลูกหนี้เงินกู้"
          })
        );
      }

      const entity = await AccountReceivableRepository.createAccountReceivable(
        AccountReceivableRepository.create(accountReceivable)
      );

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };
}

export const controller = new AccountReceivableController(
  AccountReceivableRepository
);
