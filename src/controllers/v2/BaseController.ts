import { getRepository } from "typeorm";

import { NotFoundError } from "../../middlewares/error/error-type";
import {
  createRepository,
  ICreateOptions
} from "../../repositories/v2/CreateRepository";
import { deleteRepository } from "../../repositories/v2/DeleteRepository";
import {
  IJoin,
  IJoinCondition,
  IQuery,
  ISearchOptions,
  ISubQuery,
  searchRepository
} from "../../repositories/v2/SearchRepository";
import {
  IUpdateOptions,
  updateRepository
} from "../../repositories/v2/UpdateRepository";
import { flattenObject } from "../../utils/object-helper";

export interface IRelationField {
  entityClass?: string; // Entity ClassName
  entityField: string;
  value?: any;
}

export abstract class BaseController {
  entityClass: string;
  alias: string;
  entityInfo: string;
  searchRepo = searchRepository;
  createRepo = createRepository;
  updateRepo = updateRepository;
  deleteRepo = deleteRepository;

  constructor(entityClass: string, entityInfo = "") {
    this.entityClass = entityClass;
    this.alias = this.entityClass.toLowerCase();
    this.entityInfo = entityInfo;
  }

  getMany = (options: ISearchOptions = {}) => {
    return async (req, res, next) => {
      const { query } = req;
      const { currentPage = 1, perPage = 10, ...qs } = query;

      const queries = this.prepareQuery(qs, options.queries);
      // console.log("queries", queries);
      const subQueries = this.prepareSubQuery(qs, options.subQueries);
      // console.log("subQueries", subQueries);
      const joins = this.prepareJoins(qs, options.joins);
      // console.log("joins", joins);

      try {
        const [entities, total] = await this.searchRepo.findAndCount(
          this.entityClass,
          this.alias,
          queries,
          subQueries,
          { currentPage, perPage },
          { ...options, joins }
        );

        // if (!total) {
        //   return next(
        //     new NotFoundError({
        //       name: `ไม่พบข้อมูล${this.entityInfo}ที่ต้องการ`,
        //       message: `ไม่พบข้อมูล${this.entityInfo}ที่ต้องการ`
        //     })
        //   );
        // }

        res.locals.data = entities;
        res.locals.total = total;

        next();
      } catch (err) {
        next(err);
      }
    };
  };

  protected prepareQuery = (qs: any, q: IQuery[] = []) => {
    const queries: IQuery[] = [];

    // this.queries.forEach((query) => {
    q.forEach((query) => {
      if (qs[query.queryField]) {
        queries.push({
          ...query,
          value: qs[query.queryField]
        });
      }
    });

    return queries;
  };

  protected prepareSubQuery = (qs: any, sq: ISubQuery[] = []) => {
    const subQueries: ISubQuery[] = [];

    // this.subQueries.forEach((subQuery) => {
    sq.forEach((subQuery) => {
      const queries: IQuery[] = [];

      subQuery.queries.forEach((q) => {
        if (qs[q.queryField]) {
          queries.push({ ...q, value: qs[q.queryField] });
        } else if (q.entityFieldToMap) {
          queries.push({ ...q });
        }
      });

      if (queries.length > 0) {
        subQueries.push({ ...subQuery, queries });
      }
    });

    return subQueries;
  };

  protected prepareJoins = (qs: any, js: IJoin[] = []) => {
    const joins: IJoin[] = [];

    // js.forEach((j) => {
    //   if (qs[j.queryField]) {
    //     joins.push({
    //       ...j,
    //       value: qs[j.queryField]
    //     });
    //   }
    // });
    js.forEach((j) => {
      const conditions: IJoinCondition[] = [];

      if (j.conditions) {
        j.conditions.forEach((c) => {
          if (qs[c.queryField]) {
            conditions.push({ ...c, value: qs[c.queryField] });
          } else {
            conditions.push(c);
          }
        });
      }

      joins.push({
        ...j,
        // value: qs[j.queryField] || undefined
        conditions
      });
    });

    return joins;
  };

  create = async (req, res, next) => {
    try {
      const entity = await this.createRepo.create(this.entityClass, req.body);

      res.locals.data = entity;

      next();
    } catch (err) {
      err.message = `ไม่สามารถสร้างข้อมูล${this.entityInfo} ${err.message}`;
      next(err);
    }
  };

  createWithOption = (options?: ICreateOptions) => {
    return async (req, res, next) => {
      try {
        const entity = await this.createRepo.create(
          this.entityClass,
          req.body,
          options
        );

        res.locals.data = entity;

        next();
      } catch (err) {
        err.message = `ไม่สามารถสร้างข้อมูล${this.entityInfo} ${err.message}`;
        next(err);
      }
    };
  };

  getOne = (options: ISearchOptions = {}) => {
    return async (req, res, next) => {
      const { id } = req.params;

      const queries = this.prepareQuery(req.query, options.queries);
      const joins = this.prepareJoins(req.query, options.joins);

      try {
        const entity = await this.searchRepo.findOneById(
          this.entityClass,
          this.alias,
          id,
          queries,
          { ...options, joins }
        );

        if (!entity) {
          return next(
            new NotFoundError({
              name: `ไม่พบข้อมูล${this.entityInfo}ที่ต้องการ`,
              message: `ไม่พบข้อมูล${this.entityInfo}ที่ต้องการ`
            })
          );
        }

        res.locals.data = entity;

        next();
      } catch (err) {
        err.message = `ไม่พบข้อมูล${this.entityInfo}ที่ต้องการ ${err.message}`;
        next(err);
      }
    };
  };

  update = (options: IUpdateOptions = {}) => {
    return async (req, res, next) => {
      const o2ms = this.prepareO2Ms(req.body, options.o2ms);
      const m2ms = this.prepareM2Ms(req.body, options.m2ms);

      const atfs: any[] = [];
      if (options.withFiles) {
        flattenObject(req.body, "attachedFiles", true, atfs);
      }

      try {
        const entity = await getRepository(this.entityClass).findOne(
          { id: req.params.id },
          { relations: options.relations }
        );

        if (!entity) {
          return next(
            new NotFoundError({
              name: `ไม่สามารถแก้ไขข้อมูล${this.entityInfo}`,
              message: `ไม่สามารถแก้ไขข้อมูล${this.entityInfo}เนื่องจากไม่พบข้อมูล${this.entityInfo}่ทีต้องการแก้ไขในระบบ`
            })
          );
        }

        getRepository(this.entityClass).merge(entity, req.body);

        await this.updateRepo.update(entity, {
          o2ms,
          m2ms,
          atfs
        });

        res.locals.data = entity;

        next();
      } catch (err) {
        err.message = `ไม่สามารถแก้ไขข้อมูล${this.entityInfo} ${err.message}`;
        next(err);
      }
    };
  };

  updateFiles = () => {
    return async (req, res, next) => {
      const attachedFiles = [];
      flattenObject(req.body, "attachedFiles", true, attachedFiles);

      try {
        await this.updateRepo.updateFiles(attachedFiles);

        next();
      } catch (err) {
        err.message = `ไม่สามารถอัปโหลดไฟล์สำหรับ${this.entityInfo} ${err.message}`;
        next(err);
      }
    };
  };

  protected prepareO2Ms = (body: any, o2ms: IRelationField[] = []) => {
    const newO2Ms: IRelationField[] = [];

    o2ms.forEach((o2m) => {
      if (body[o2m.entityField]) {
        newO2Ms.push({ ...o2m, value: body[o2m.entityField] });
        delete body[o2m.entityField]; // delete for update
      }
    });

    return newO2Ms;
  };

  protected prepareM2Ms = (body: any, m2ms: IRelationField[] = []) => {
    const newM2Ms: IRelationField[] = [];

    m2ms.forEach((m2m) => {
      if (body[m2m.entityField]) {
        newM2Ms.push({ ...m2m, value: body[m2m.entityField] });
      }
    });

    return newM2Ms;
  };

  delete = async (req, res, next) => {
    const { id } = req.params;
    try {
      const result = await this.deleteRepo.delete(this.entityClass, +id);

      res.locals.data = result;

      next();
    } catch (err) {
      err.message = `ไม่สามารถลบข้อมูล${this.entityInfo} ${err.message}`;
      next(err);
    }
  };
}
