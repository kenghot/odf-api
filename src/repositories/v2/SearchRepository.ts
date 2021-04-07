import { EntityManager, EntityRepository, getCustomRepository } from "typeorm";
import { DBError } from "../../middlewares/error/error-type";
import {
  getInnerJoin,
  getLeftJoin,
  getLeftJoinAndMap,
  getLeftJoinAndSelect,
  getOrderBy,
  getRelation,
  getSelect,
  getSkip,
  getSubWhere,
  getTake,
  getWhere,
} from "../../utils/query-helper";

export interface IOrderBy {
  entityField: string;
  orderType: string; // ["ASC", "DESC"]
  alias?: string; // for specific
}
export interface IJoinCondition {
  joinFieldToMap?: string;
  operator?: string;
  entityFieldToMap?: string;
  queryField?: string;
  value?: any;
  alias?: string; // use with specific alias
}
export interface IJoinAndSelect {
  type: string; // ["leftJoinAndSelect", "leftJoinAndMapOne", "leftJoinAndMapMany"]
  entityField?: string;
  entityAlias?: string;
  joinEntityAlias?: string;
  conditions?: IJoinCondition[];
  alias?: string;
}
export interface IJoinAndMap {
  type: string; // ["leftJoinAndSelect", "leftJoinAndMapOne", "leftJoinAndMapMany"]
  mapToField?: string;
  mapEntityAlias?: string;
  mapFromField?: string;
  joinEntityClass?: string; // use with entityFieldToMap
  joinEntityAlias?: string;
  conditions?: IJoinCondition[];
  alias?: string;
}
export interface IJoin extends IJoinAndSelect, IJoinAndMap {}
export interface ISearchOptions {
  selectedFields?: string[]; // exmaple ["id", "name"]
  relations?: string[]; // example ["relationEntity", "relationEntity.subRelationEntity"]
  joins?: IJoin[];
  orderBy?: IOrderBy[];
  queries?: IQuery[];
  subQueries?: ISubQuery[];
  joinRelations?: string[];
}
export interface IQuery {
  operator: string;
  entityField: string;
  queryField?: string;
  value?: any;
  alias?: string; // use for specific alias
  entityFieldToMap?: string;
}
export interface ISubQuery {
  operator: string;
  entityField: string; // field to add to queries in EntityClass
  subEntityClass?: string;
  alias?: string;
  subEntityField?: string; // selectedField from subEntityClass
  join?: string; // join type ["innerJoin", "leftJoinAndSelect"] for advance queries in subEntityClass
  joinAlias?: string;
  joinField?: string; // field to join
  queries?: IQuery[];
  function?: string;
  entityAlias?: string;
}
export interface IPagination {
  currentPage?: number;
  perPage?: number;
}

@EntityRepository()
class SearchRepository {
  constructor(private manager: EntityManager) {}

  async findAndCount(
    entityClass: string,
    alias: string,
    queries: IQuery[] = [],
    subQueries: ISubQuery[] = [],
    pagination: IPagination = {},
    options: ISearchOptions = {}
  ) {
    const {
      selectedFields = [],
      relations = [],
      joins = [],
      orderBy = [],
    } = options;
    const { currentPage, perPage } = pagination;
    const hasPaging = currentPage && perPage && true;
    const skip = hasPaging && (+currentPage - 1) * +perPage;

    const hasQuery = queries.length > 0 ? true : false;

    try {
      // generate query builder string
      const findAndCount = this.getQueryBuilder(
        "findAndCount",
        entityClass,
        alias,
        this.getSelectedField(selectedFields, alias),
        this.getRelation(relations, alias),
        this.getJoin(joins, alias),
        this.getWhereClause(alias, queries),
        this.getSubQueryBuilder(subQueries, alias, hasQuery),
        hasPaging && this.getPagination(skip, perPage),
        this.getOrderBy(orderBy, alias)
      );

      // console.log("findAndCount ==>", findAndCount);

      // tslint:disable-next-line: no-eval
      const [records, total] = await eval(findAndCount);

      return [records, total];
    } catch (err) {
      console.log(err);
      throw new DBError({ message: err.message });
    }
  }

  async findOneById(
    entityClass: string,
    alias: string,
    id: string | number,
    queries: IQuery[] = [],
    options: ISearchOptions = {}
  ) {
    const {
      selectedFields = [],
      relations = [],
      joins = [],
      orderBy = [],
    } = options;

    // add id to queries
    queries.push({
      operator: "=",
      entityField: "id",
      queryField: "id",
      value: id,
    });

    try {
      // generate query builder string
      const findOne = this.getQueryBuilder(
        "findOne",
        entityClass,
        alias,
        this.getSelectedField(selectedFields, alias),
        this.getRelation(relations, alias),
        this.getJoin(joins, alias),
        this.getWhereClause(alias, queries),
        "",
        "",
        this.getOrderBy(orderBy, alias)
      );

      // console.log("findOne ==>", findOne);

      // tslint:disable-next-line: no-eval
      const record = await eval(findOne);

      return record;
    } catch (err) {
      throw new DBError({ message: err.message });
    }
  }

  private getSubQuery = (subQuery: ISubQuery, alias: string, where: string) => {
    let selectedField = "";
    // if (subQuery.function) {
    selectedField = subQuery.function
      ? `${subQuery.function}(${subQuery.alias}.${subQuery.subEntityField})`
      : `${subQuery.alias}.${subQuery.subEntityField}`;
    // } else {
    //   selectedField = `${subQuery.alias}.${subQuery.subEntityField}`;
    // }
    return `.${where}((qb) => {
		const subQuery = qb
		.subQuery()
		.select("${selectedField}")
		.from("${subQuery.subEntityClass}", "${subQuery.alias}")
		${
      subQuery.join
        ? this.getSubJoin(subQuery)
        : this.getSubWhereClause(subQuery.alias, subQuery.queries)
    }
		.getQuery();
		return "${subQuery.entityAlias ? subQuery.entityAlias : alias}.${
      subQuery.entityField
    } ${subQuery.operator}" + subQuery;
		})`;
  };

  private getSubQueryBuilder = (
    subQueries: ISubQuery[],
    alias: string,
    hasQuery: boolean
  ) => {
    let subQueryString = "";
    let where = hasQuery ? "andWhere" : "where";

    subQueries.forEach((subQ) => {
      subQueryString = `${subQueryString}${this.getSubQuery(
        subQ,
        alias,
        where
      )}`;
      where = "andWhere";
    });

    return subQueryString;
  };

  private getQueryBuilder = (
    method: string,
    entityClass: string,
    alias: string,
    select = "",
    leftJoin = "",
    joinTable = "",
    whereClause = "",
    subQuery = "",
    pagination = "",
    orderBy = ""
  ) => {
    if (method === "findAndCount") {
      return `this.manager.createQueryBuilder("${entityClass}", "${alias}")
      ${select}${leftJoin}${joinTable}${whereClause}${subQuery}${pagination}${orderBy}
      .getManyAndCount()
    `;
    } else if (method === "findOne") {
      return `this.manager.createQueryBuilder("${entityClass}", "${alias}")
      ${select}${leftJoin}${joinTable}${whereClause}${orderBy}
      .getOne()
    `;
    }
  };

  private getWhereClause = (alias: string, queries: IQuery[]) => {
    let whereClause = "";
    let isFirstWhere = true;
    queries.forEach((query, index) => {
      const {
        operator,
        entityField,
        queryField = "",
        value,
        alias: queryAlias,
      } = query;
      if (value) {
        whereClause = `${whereClause}${getWhere(
          operator,
          queryAlias ? queryAlias : alias, // use query alias instead of default alias
          entityField,
          queryField,
          value,
          isFirstWhere
        )}`;
        isFirstWhere = false;
      }
    });

    return whereClause;
  };

  private getSubWhereClause = (alias: string, queries: IQuery[]) => {
    let whereClause = "";
    let isFirstWhere = true;
    queries.forEach((query, index) => {
      const { operator, entityField, queryField = "", value, alias: a } = query;
      // if (value) {
      whereClause = `${whereClause}${getSubWhere(
        operator,
        a ? a : alias,
        entityField,
        queryField,
        value,
        isFirstWhere,
        query.entityFieldToMap
      )}`;
      isFirstWhere = false;
      // }
    });

    return whereClause;
  };

  private getSubJoin = (subQuery: ISubQuery) => {
    let joinString = "";
    const { join } = subQuery;
    switch (join) {
      case "innerJoin":
        joinString = this.getInnerJoin(subQuery);
        break;
      case "leftJoin":
        joinString = this.getLeftJoin(subQuery);
        break;
    }

    return joinString;
  };

  private getLeftJoin = (subQuery: ISubQuery) => {
    let leftJoin = "";
    const { alias, joinField, joinAlias, queries } = subQuery;
    leftJoin = getLeftJoin(joinField, joinAlias, alias);
    leftJoin = `${leftJoin}${this.getSubWhereClause(alias, queries)}`;
    return leftJoin;
  };

  private getSelectedField = (selectedFields: string[], alias) => {
    return selectedFields.length > 0 ? getSelect(alias, selectedFields) : "";
  };

  private getInnerJoin = (subQuery: ISubQuery) => {
    let innerJoin = "";
    const { alias, joinAlias, joinField, queries } = subQuery;
    queries.forEach((query) => {
      const { operator, entityField, queryField = "", value } = query;
      innerJoin = `${innerJoin}${getInnerJoin(
        alias,
        joinField,
        joinAlias,
        operator,
        entityField,
        queryField,
        value
      )}`;
    });

    return innerJoin;
  };

  private getRelation = (relations: string[], alias: string) => {
    let leftJoin = "";

    relations.forEach((relation) => {
      let joinAlias = relation;
      let nestedAlias = "";

      const slice = relation.split(".");

      // check if nested relation
      if (slice.length > 1) {
        relation = joinAlias = slice.pop();
        nestedAlias = slice.pop();
      }

      leftJoin = `${leftJoin}${getRelation(
        relation,
        joinAlias ? joinAlias : relation,
        nestedAlias ? nestedAlias : alias // use nestedAlias if relation is nested
      )}`;
      // leftJoin = `${leftJoin}${getLeftJoinAndSelect(
      //   relation,
      //   joinAlias ? joinAlias : relation,
      //   nestedAlias ? nestedAlias : alias // use nestedAlias if relation is nested
      // )}`;
    });

    return leftJoin;
  };

  // private getLeftJoinAndMap = (joins: IJoinAndMap[], alias: string) => {
  //   let leftJoinAndMapString = "";

  //   joins.forEach((join) => {
  //     const {
  //       type,
  //       joinEntityClass,
  //       joinEntityAlias,
  //       mapToField,
  //       mapEntityAlias,
  //       mapFromField,
  //       conditions
  //     } = join;
  //     leftJoinAndMapString = `${leftJoinAndMapString}${getLeftJoinAndMap(
  //       type,
  //       alias,
  //       mapToField,
  //       mapEntityAlias,
  //       mapFromField,
  //       joinEntityClass,
  //       joinEntityAlias,
  //       conditions
  //     )}`;
  //   });

  //   return leftJoinAndMapString;
  // };

  private getPagination = (skip: number, perPage: number) => {
    return `${getSkip(skip)}${getTake(perPage)}`;
  };

  private getOrderBy = (orderBy: IOrderBy[], defaultAlias: string) => {
    let orderByClause = "";
    let isFirstOrder = true;
    orderBy.forEach((ob) => {
      const { entityField, orderType, alias } = ob;
      orderByClause = `${orderByClause}${getOrderBy(
        alias ? alias : defaultAlias,
        entityField,
        orderType,
        isFirstOrder
      )}`;
      isFirstOrder = false;
    });
    return orderByClause;
  };

  private getJoin = (joins: IJoin[], alias: string) => {
    let leftJoinString = "";

    joins.forEach((join) => {
      const { type } = join;
      if (type === "leftJoinAndSelect") {
        leftJoinString = `${leftJoinString}${getLeftJoinAndSelect(
          type,
          join.alias ? join.alias : alias,
          join.entityField,
          join.entityAlias,
          join.joinEntityAlias,
          join.conditions
        )}`;
      }
      if (type === "leftJoinAndMapOne" || type === "leftJoinAndMapMany") {
        leftJoinString = `${leftJoinString}${getLeftJoinAndMap(
          type,
          alias,
          join.mapToField,
          join.mapEntityAlias,
          join.mapFromField,
          join.joinEntityClass,
          join.joinEntityAlias,
          join.conditions
        )}`;
      }
    });

    return leftJoinString;
  };
}

export const searchRepository = getCustomRepository(SearchRepository);
