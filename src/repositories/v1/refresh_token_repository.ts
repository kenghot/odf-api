import { EntityRepository, getCustomRepository, Repository } from "typeorm";
import { RefreshToken } from "../../entities/RefreshToken";

@EntityRepository(RefreshToken)
class RefreshTokenRepository extends Repository<RefreshToken> {}

export default getCustomRepository(RefreshTokenRepository);
