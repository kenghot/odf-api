import { EntityRepository, getCustomRepository, Repository } from "typeorm";
import { Blacklist } from "../../entities/Blacklist";

@EntityRepository(Blacklist)
class BlacklistRepository extends Repository<Blacklist> {}

export default getCustomRepository(BlacklistRepository);
