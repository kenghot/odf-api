import { EntityRepository, getCustomRepository, Repository } from "typeorm";
import { Occupation } from "../../entities/Occupation";

@EntityRepository(Occupation)
class OccupationRepository extends Repository<Occupation> {}

export default getCustomRepository(OccupationRepository);
