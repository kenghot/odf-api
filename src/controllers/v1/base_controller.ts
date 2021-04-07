import { RequestHandler } from "express";
import { DeepPartial, Repository } from "typeorm";

import { NotFoundError } from "../../middlewares/error/error-type";

export interface IGetOptions {
  relations?: string[];
  selectedFields?: string[];
}

export abstract class BaseController {
  constructor(public repository: Repository<any>) {}

  getMany = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      const { currentPage = 1, perPage = 10, ...qs } = req.query;
      try {
        const [entities, total] = await this.repository.findAndCount({
          select:
            options && options.selectedFields
              ? options.selectedFields
              : undefined,
          where: { ...qs },
          relations:
            options && options.relations ? options.relations : undefined,
          skip: (+currentPage - 1) * perPage,
          take: perPage
        });

        if (!total) {
          // return next(new NotFoundError({ message: "ไม่พบข้อมูลที่ต้องการ" }));
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
    const body: DeepPartial<any> = req.body;
    try {
      const entity = this.repository.create(body);

      await this.repository.save(entity);
      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };

  getOne = (options?: IGetOptions, deepRelation?: boolean) => {
    return async (req, res, next) => {
      // const { id } = req.params;
      try {
        const entity = await this.repository.findOne(
          { id: req.params.id },
          {
            select:
              options && options.selectedFields
                ? options.selectedFields
                : undefined,
            join: deepRelation ? undefined : { alias: "ett" }, // for bug on typeorm
            relations:
              options && options.relations ? options.relations : undefined
          }
        );
        if (!entity) {
          return next(new NotFoundError({ message: "not found" }));
        }

        res.send({ data: entity, success: true });
      } catch (e) {
        next(e);
      }
    };
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const entity = await this.repository.preload({
        id: req.params.id,
        ...req.body
      });
      const record = await this.repository.save(entity);
      res.send({ data: record, success: true });
    } catch (e) {
      next(e);
    }
  };

  delete: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.repository.delete(+req.params.id);
      if (!result.affected) {
        return next(new Error(result.raw.message));
      }
      res.send({ success: true });
    } catch (e) {
      next(e);
    }
  };
}
