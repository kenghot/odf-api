import { RequestHandler } from "express";

import { getRepository } from "typeorm";
import { AttachedFile } from "../../entities/AttachedFile";
import { User } from "../../entities/User";
import {
  NotFoundError,
  ValidateError
} from "../../middlewares/error/error-type";
import { UserRepository } from "../../repositories/v1";
import { flattenObject } from "../../utils/object-helper";
import { BaseController, IGetOptions } from "./base_controller";

class UserController extends BaseController {
  getMany = (options?: IGetOptions): RequestHandler => {
    return async (req, res, next) => {
      try {
        const [entities, total] = await UserRepository.findUsers(
          req.query,
          options
        );

        if (!total) {
          next();
          // return next(
          //   new NotFoundError({
          //     name: "ไม่พบรายการผู้ใช้",
          //     message: "ไม่พบรายการผู้ใช้"
          //   })
          // );
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
    const {
      password,
      confirmPassword,
      resetPasswordToken,
      resetPasswordTokenExpiration,
      ...rest
    } = req.body as User;
    try {
      const user = UserRepository.create(rest);
      user.active = true;

      const entity = await UserRepository.createUser(user);

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    const {
      roles,
      responsibilityOrganizations,
      attachedFiles,
      password,
      confirmPassword,
      resetPasswordToken,
      resetPasswordTokenExpiration,
      activeString,
      ...rest
    } = req.body as User;
    try {
      if (activeString === "true") {
        rest.active = true;
      } else if (activeString === "false") {
        rest.active = false;
      }

      let user: any;
      if (rest.username) {
        user = await UserRepository.findOne({
          username: rest.username
        });

        if (user && user.id !== req.params.id) {
          return next(
            new ValidateError({
              name: "ไม่สามารถแก้ไขชื่อผู้ใช้งานได้",
              message:
                "ชื่อผู้ใช้งานถูกใช้งานแล้วในระบบ กรุณาตั้งชื่อผู้ใช้งานใหม่"
            })
          );
        }
      }

      user = await UserRepository.create({
        id: req.params.id,
        ...rest
      });

      if (password) {
        user.password = password;
        user.confirmPassword = confirmPassword;
      }

      const _attachedFiles = [];
      flattenObject(req.body, "attachedFiles", true, _attachedFiles);

      const entity = await UserRepository.updateUser(
        user,
        roles,
        responsibilityOrganizations,
        // getRepository(AttachedFile).create(attachedFiles)
        getRepository(AttachedFile).create(_attachedFiles)
        // attachedFiles
      );

      next();
    } catch (e) {
      next(e);
    }
  };
  getOne = (options?: IGetOptions, deepRelation?: boolean): RequestHandler => {
    return async (req, res, next) => {
      const { id } = req.params;
      try {
        const entity = await UserRepository.createQueryBuilder("user")
          .leftJoinAndSelect("user.organization", "organization")
          .leftJoinAndSelect("user.roles", "roles")
          .leftJoinAndSelect(
            "user.responsibilityOrganizations",
            "responsibilityOrganizations"
          )
          .leftJoinAndMapMany(
            "user.attachedFiles",
            "AttachedFile",
            "attachedFile",
            "attachedFile.refId = :refId and attachedFile.refType = :refType",
            { refId: id, refType: "USER.ATTACHEDFILE" }
          )
          .where("user.id = :id", { id })
          .getOne();

        if (!entity) {
          return next(new NotFoundError({ message: "not found" }));
        }

        res.send({ data: entity, success: true });
      } catch (e) {
        next(e);
      }
    };
  };
}

export const controller = new UserController(UserRepository);
