import {
  DeepPartial,
  EntityManager,
  EntityRepository,
  getCustomRepository
} from "typeorm";
import { DBError } from "../../middlewares/error/error-type";

export interface ICreateOptions {
  listeners?: boolean;
}

@EntityRepository()
class CreateRepository {
  constructor(private manager: EntityManager) {}

  async create(
    entityClass: string,
    data: DeepPartial<any>,
    options: ICreateOptions = {}
  ) {
    const { listeners = true } = options;
    const entity = this.manager.create(entityClass, data);

    try {
      await this.manager.save(entity, { listeners });

      return entity;
    } catch (err) {
      console.log(err);
      if (err.code === "ER_DUP_ENTRY") {
        throw new DBError({
          message: `กรุณาตรวจสอบว่าข้อมูลที่เลือกไม่ได้ถูกใช้ไปก่อนแล้ว ${err.sqlMessage}`
        });
      }
      if (err.constructor.errorCode === 400) {
        throw err;
      }
      throw new DBError({ message: err.message });
    }
  }
}

export const createRepository = getCustomRepository(CreateRepository);
