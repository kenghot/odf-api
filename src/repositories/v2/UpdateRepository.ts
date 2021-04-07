import {
  EntityManager,
  EntityRepository,
  getCustomRepository,
  getManager,
  getRepository
} from "typeorm";
import { IRelationField } from "../../controllers/v2/BaseController";
import { AttachedFile } from "../../entities/AttachedFile";
import { DBError } from "../../middlewares/error/error-type";

export interface IUpdateOptions {
  relations?: string[];
  o2ms?: IRelationField[]; // for OneToMany
  m2ms?: IRelationField[]; // for ManyToMany
  atfs?: any; // for attachedFiles
  withFiles?: boolean;
}

@EntityRepository()
class UpdateRepository {
  constructor(private manager: EntityManager) {}

  async update(entityObj: any, options: IUpdateOptions = {}): Promise<any> {
    const { o2ms = [], m2ms = [], atfs } = options;

    try {
      await getManager().transaction(async (transactionEntityManager) => {
        // update O2M
        for (const o2m of o2ms) {
          await transactionEntityManager.remove(
            o2m.entityClass,
            entityObj[o2m.entityField]
          );
          entityObj[o2m.entityField] = getRepository(o2m.entityClass).create(
            o2m.value
          );
        }
        // update M2M
        for (const m2m of m2ms) {
          entityObj[m2m.entityField] = m2m.value ? [] : undefined;

          await transactionEntityManager.save(entityObj);

          entityObj[m2m.entityField] = m2m.value ? m2m.value : undefined;
        }

        // update AttachedFiles
        if (atfs && atfs.length > 0) {
          const attachedFiles = getRepository(AttachedFile).create(atfs);
          await transactionEntityManager.save(attachedFiles);
        }

        const record = await transactionEntityManager.save(entityObj);

        return record;
      });
    } catch (err) {
      console.error(err);
      if (err.constructor.errorCode === 400) {
        throw err;
      }
      throw new DBError({ message: err.message });
    }
  }

  async updateFiles(fileBody: any) {
    try {
      // update AttachedFiles
      const fileRepo = getRepository(AttachedFile);
      const files = fileRepo.create(fileBody);
      await fileRepo.save(files);

      return files;
    } catch (err) {
      console.error(err);
      throw new DBError({ message: err.message });
    }
  }
}

export const updateRepository = getCustomRepository(UpdateRepository);
