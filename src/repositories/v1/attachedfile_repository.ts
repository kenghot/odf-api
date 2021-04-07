import { EntityRepository, getCustomRepository, Repository } from "typeorm";
import { AttachedFile } from "../../entities/AttachedFile";

@EntityRepository(AttachedFile)
class AttachedFileRepository extends Repository<AttachedFile> {}

export default getCustomRepository(AttachedFileRepository);
