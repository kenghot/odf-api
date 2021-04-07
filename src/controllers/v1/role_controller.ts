import { RequestHandler } from "express";
import { DeepPartial } from "typeorm";
import { Role } from "../../entities/Role";
import { RoleRepository } from "../../repositories/v1";
import { BaseController } from "./base_controller";

class RoleController extends BaseController {
  update: RequestHandler = async (req, res, next) => {
    const body: DeepPartial<Role> = req.body;
    try {
      const role = await RoleRepository.findOne({
        id: req.params.id
      });

      await RoleRepository.merge(role, body);

      const entity = await RoleRepository.updateRole(role);

      res.send({ data: entity, success: true });
    } catch (e) {
      next(e);
    }
  };
}

export const controller = new RoleController(RoleRepository);
