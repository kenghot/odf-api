import { getRepository } from "typeorm";
import { User } from "../../entities/User";
import { ValidateError } from "../../middlewares/error/error-type";
import { IUpdateOptions } from "../../repositories/v2/UpdateRepository";
import UserRepository from "../../repositories/v2/UserRepository";
import { flattenObject } from "../../utils/object-helper";
import { BaseController } from "./BaseController";

class UserController extends BaseController {
  constructor(entityClass: string, entityInfo: string) {
    super(entityClass, entityInfo);
  }

  getPosAdminUsers = async (req, res, next) => {
    const { organizationId, firstname } = req.query;
    try {
      const [users, total] = await UserRepository.findPosAdminUsers(
        organizationId,
        firstname
      );
      res.locals.data = users;
      res.locals.total = total;
      next();
    } catch (err) {
      next(err);
    }
  };

  update = (options: IUpdateOptions = {}) => {
    return async (req, res, next) => {
      try {
        let entity: any;

        // // check if user try to edit username
        entity = await getRepository(this.entityClass).findOne(
          { username: req.body.username },
          { relations: options.relations }
        );

        if (!entity) {
          entity = await getRepository(this.entityClass).findOne(
            { id: req.params.id },
            { relations: options.relations }
          );
        } else if (entity.id !== req.params.id) {
          return next(
            new ValidateError({
              name: "ไม่สามารถแก้ไขชื่อผู้ใช้งานได้",
              message:
                "ชื่อผู้ใช้งานถูกใช้งานแล้วในระบบ กรุณาตั้งชื่อผู้ใช้งานใหม่"
            })
          );
        }

        getRepository(this.entityClass).merge(entity, req.body);

        if (req.body.password) {
          entity.password = req.body.password;
          entity.confirmPassword = req.body.confirmPassword;
        }

        const o2ms = this.prepareO2Ms(req.body, options.o2ms);
        const m2ms = this.prepareM2Ms(req.body, options.m2ms);
        const atfs: any[] = [];
        flattenObject(req.body, "attachedFiles", true, atfs);

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

  withFormData = (req, res, next) => {
    // fix update by form data
    if (req.body.activeString === "true") {
      req.body.active = true;
    } else if (req.body.activeString === "false") {
      req.body.active = false;
    }

    next();
  };
}

export const controller = new UserController("User", "ผู้ใช้งาน");
