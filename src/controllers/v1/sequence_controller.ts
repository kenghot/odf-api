import { RequestHandler } from "express";
import { DeepPartial, getRepository } from "typeorm";
import { AgreementSequence } from "../../entities/AgreementSequence";
import { GuaranteeSequence } from "../../entities/GuaranteeSequence";
import { RequestSequence } from "../../entities/RequestSequence";
import { RequestOnlineSequence } from "../../entities/RequestOnlineSequence";
import { VoucherSequence } from "../../entities/VoucherSequence";
import { sequenceTypeSet } from "../../enumset";
import {
  BadRequestError,
  DBError,
  NotFoundError
} from "../../middlewares/error/error-type";
import {
  AgreementSequenceRepository,
  GuaranteeSequenceRepository,
  ReceiptSequenceRepository,
  RequestSequenceRepository,
  RequestOnlineSequenceRepository,
  VoucherSequenceRepository
} from "../../repositories/v1";
import PosRepository from "../../repositories/v2/PosRepository";
import { IGetOptions } from "./base_controller";

export interface ISequenceQuery {
  sequenceType?: sequenceTypeSet;
  prefixCode?: string;
  prefixYear?: string;
  currentPage?: string;
  perPage?: string;
}

export class SequenceController {
  static getMany = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      const { sequenceType, ...query } = req.query as ISequenceQuery;
      const sequenceRepository = SequenceController.getRepo(sequenceType);

      if (!sequenceRepository) {
        return next(new BadRequestError({ message: "no sequenceType in qs" }));
      }

      try {
        const [entities, total] = await sequenceRepository.findSequencies(
          query,
          options && options.relations ? options.relations : undefined
        );

        if (!total) {
          // return next(
          //   new NotFoundError({
          //     name: "ไม่พบเลขที่เอกสารที่ต้องการ",
          //     message: "ไม่พบเลขที่เอกสารที่ต้องการ"
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

  static create: RequestHandler = async (req, res, next) => {
    const { sequenceType, ...rest } = req.body;
    const body: DeepPartial<
      RequestSequence | RequestOnlineSequence | AgreementSequence | GuaranteeSequence | VoucherSequence
    > = rest;

    const sequenceRepository = SequenceController.getRepo(sequenceType);

    if (!sequenceRepository) {
      return next(new BadRequestError({ message: "no sequenceType in body" }));
    }

    try {
      const entity = sequenceRepository.create(body);

      await sequenceRepository.save(entity);

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };

  static getOne = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      const { sequenceType } = req.query as ISequenceQuery;

      const sequenceRepository: any = SequenceController.getRepo(sequenceType);

      if (!sequenceRepository) {
        return next(
          new BadRequestError({
            message: "ไม่พบประเภทของเลขที่เอกสาร"
          })
        );
      }

      const { id } = req.params;

      try {
        const entity = await sequenceRepository.findOne(
          { id },
          {
            relations:
              options &&
              options.relations &&
              sequenceType !== sequenceTypeSet.receipt
                ? options.relations
                : undefined
          }
        );

        if (!entity) {
          return next(
            new NotFoundError({
              name: "ไม่พบเลขที่เอกสารที่ต้องการ",
              message: "ไม่พบเลขที่เอกสารที่ต้องการ"
            })
          );
        }

        if (sequenceType === sequenceTypeSet.receipt) {
          entity.organizations = await PosRepository.findOrganizationsByReceiptSequence(
            id
          );
        }

        res.send({ data: entity, success: true });
      } catch (e) {
        next(e);
      }
    };
  };

  static update: RequestHandler = async (req, res, next) => {
    const { sequenceType, ...rest } = req.body;
    const body: DeepPartial<
      RequestSequence | RequestOnlineSequence| AgreementSequence | GuaranteeSequence | VoucherSequence
    > = rest;

    const sequenceRepository = SequenceController.getRepo(sequenceType);

    if (!sequenceRepository) {
      return next(new BadRequestError({ message: "no sequenceType in body" }));
    }

    try {
      const entity = await sequenceRepository.findOne({ id: +req.params.id });
      await sequenceRepository.merge(entity, body);

      await sequenceRepository.save(entity);

      req.query.sequenceType = sequenceType;
      next();
    } catch (e) {
      next(e);
    }
  };

  static delete: RequestHandler = async (req, res, next) => {
    const { sequenceType } = req.body;

    const sequenceRepository = SequenceController.getRepo(sequenceType);

    if (!sequenceRepository) {
      return next(new BadRequestError({ message: "no sequenceType in body" }));
    }

    try {
      const result = await sequenceRepository.delete({ id: +req.params.id });
      if (!result.affected) {
        return next(new Error(result.raw.message));
      }
      res.send({ success: true });
    } catch (e) {
      if (e.errno === 1451) {
        return next(
          new DBError({
            name: "ไม่สามารถลบเลขที่เอกสารได้",
            message:
              "ไม่สามารถลบเลขที่เอกสารได้เนื่องจากมีหน่วยงานที่ใช้งานเลขที่เอกสารนี้อยู่"
          })
        );
      }
      next(e);
    }
  };

  private static getRepo = (sequenceType: sequenceTypeSet) => {
    switch (sequenceType) {
      case sequenceTypeSet.request:
        return RequestSequenceRepository;
      case sequenceTypeSet.requestOnline:
        return RequestOnlineSequenceRepository;
      case sequenceTypeSet.agreement:
        return AgreementSequenceRepository;
      case sequenceTypeSet.guarantee:
        return GuaranteeSequenceRepository;
      case sequenceTypeSet.voucher:
        return VoucherSequenceRepository;
      case sequenceTypeSet.receipt:
        return ReceiptSequenceRepository;
    }
  };
}
