import {
  IJoinAndSelect,
  IJoinCondition
} from "../repositories/v2/SearchRepository";

export const getSelect = (entity: string, selectedFields: string[]) => {
  let s = "";
  selectedFields.forEach((field, index) => {
    s = index === 0 ? `"${entity}.${field}"` : `${s}, "${entity}.${field}"`;
  });
  return `.select([${s}])`;
};

export const getWhere = (
  operator: string,
  entity: string,
  entityField: string,
  queryField: string,
  value: any,
  isFirst: boolean
) => {
  if (value) {
    if (typeof value === "string") {
      value = value.trim();
    }
    const where = isFirst ? ".where" : ".andWhere";
    if (operator === "like") {
      return `${where}("${entity}.${entityField} ${operator} :${entityField}", { ${entityField}: '${"%" +
        value +
        "%"}' })`;
    } else if (operator === "in" || operator === "not in") {
      if (Array.isArray(value)) {
        const newValue = value.map((v) => `"${v}"`); // format element to "value"
        return `${where}("${entity}.${entityField} ${operator}(:${entityField})", { ${entityField}: [${newValue}] })`;
      } else {
        return `${where}("${entity}.${entityField} ${operator}(:${entityField})", { ${entityField}: "${value}" })`;
      }
    } else if (operator === "=" || operator === ">=" || operator === "<=") {
      return queryField
        ? `${where}("${entity}.${entityField} ${operator} :${queryField}", { ${queryField}: "${value}" })`
        : "";
    }
  }
  return "";
};

export const getSubWhere = (
  operator: string,
  alias: string,
  field: string,
  queryField: string,
  value: any,
  isFirst: boolean,
  fieldToMap?: string
) => {
  if (value) {
    if (typeof value === "string") {
      value = value.trim();
    }
    const where = isFirst ? ".where" : ".andWhere";
    if (operator === "like") {
      return `${where}("${alias}.${field} ${operator} :${queryField}", { ${queryField}: '${"%" +
        value +
        "%"}'})`;
    } else if (operator === "in" || operator === "not in") {
      if (Array.isArray(value)) {
        const newValue = value.map((v) => `"${v}"`); // format element to "value"
        return `${where}("${alias}.${field} ${operator}(:${queryField})", { ${queryField}: [${newValue}] })`;
      } else {
        return `${where}("${alias}.${field} ${operator}(:${queryField})", { ${queryField}: ${value}})`;
      }
      // return `${where}("${alias}.${field} ${operator}(:${queryField})", { ${queryField}: ${value}})`;
    } else if (operator === "=" || operator === ">=" || operator === "<=") {
      return queryField
        ? `${where}("${alias}.${field} ${operator} :${queryField}", { ${queryField}: ${value} })`
        : "";
    }
  } else if (fieldToMap) {
    const where = isFirst ? ".where" : ".andWhere";
    if (operator === "like") {
      return `${where}("${alias}.${field} ${operator} ${fieldToMap}")`;
    } else if (operator === "in" || operator === "not in") {
      return `${where}("${alias}.${field} ${operator}(${fieldToMap})")`;
    } else if (operator === "=" || operator === ">=" || operator === "<=") {
      return `${where}("${alias}.${field} ${operator} ${fieldToMap}")`;
    }
  }
  return "";
};

export const getLeftJoin = (
  relationField: string,
  joinAlias: string,
  alias: string
) => {
  return `.leftJoin("${alias}.${relationField}", "${joinAlias}")`;
};

export const getRelation = (
  relationField: string,
  joinAlias: string,
  alias: string
) => {
  return `.leftJoinAndSelect("${alias}.${relationField}", "${joinAlias}")`;
};

export const getLeftJoinAndSelect = (
  type: string,
  alias: string,
  entityField: string,
  entityAlias: string,
  joinEntityAlias: string,
  conditions?: IJoinCondition[]
) => {
  const hasCondition = conditions && conditions.length > 0 ? true : false;
  const mapToFieldString = `"${
    entityAlias ? entityAlias : alias
  }.${entityField}",`;
  const joinEntityAliasString = joinEntityAlias
    ? ` "${joinEntityAlias}"${hasCondition ? "," : ""}`
    : "";
  const joinCondition =
    conditions && conditions.length > 0
      ? `${getJoinConditions(conditions, joinEntityAlias, alias)}`
      : "";

  return `.${type}(${mapToFieldString}${joinEntityAliasString}${joinCondition})`;
};

// export const getLeftJoinAndMapOne = (
//   alias: string,
//   mapToField: string,
//   mapFromField: string,
//   joinEntityClass: string,
//   joinEntityAlias: string,
//   joinFieldToMap: string,
//   operator: string,
//   entityFieldToMap?: string,
//   queryField?: string,
//   value?: any
// ) => {
//   if (operator === "=") {
//     if (value) {
//       // join and map to field from field with query value
//       return `.leftJoinAndMapOne("${alias}.${mapToField}", "${alias}.${mapFromField}", "${joinEntityAlias}"
//     , "${joinEntityAlias}.${joinFieldToMap} ${operator} :${queryField}", { ${queryField}: ${value} })`;
//     } else {
//       // join and map to field from joinField to fieldToMap
//       return `.leftJoinAndMapOne("${alias}.${mapToField}", "${joinEntityClass}", "${joinEntityAlias}"
//     , "${joinEntityAlias}.${joinFieldToMap} ${operator} ${alias}.${entityFieldToMap}")`;
//     }
//   }
// };

// export const getLeftJoinAndMapMany = (
//   alias: string,
//   mapToField: string,
//   mapFromField: string,
//   joinEntityClass: string,
//   joinEntityAlias: string,
//   joinFieldToMap: string,
//   operator: string,
//   entityFieldToMap?: string,
//   queryField?: string,
//   value?: any
// ) => {
//   if (operator === "=") {
//     if (value) {
//       // join and map to field from field with query value
//       return `.leftJoinAndMapMany("${alias}.${mapToField}", "${alias}.${mapFromField}", "${joinEntityAlias}"
//     , "${joinEntityAlias}.${joinFieldToMap} ${operator} :${queryField}", { ${queryField}: ${value} })`;
//     } else {
//       // join and map to field from joinField to fieldToMap
//       return `.leftJoinAndMapMany("${alias}.${mapToField}", "${joinEntityClass}", "${joinEntityAlias}"
//     , "${joinEntityAlias}.${joinFieldToMap} ${operator} ${alias}.${entityFieldToMap}")`;
//     }
//   }
// };

export const getLeftJoinAndMap = (
  type: string,
  alias: string,
  mapToField: string,
  mapEntityAlias: string,
  mapFromField: string,
  joinEntityClass: string,
  joinEntityAlias: string,
  conditions?: IJoinCondition[]
) => {
  const mapToFieldString = `"${
    mapEntityAlias ? mapEntityAlias : alias
  }.${mapToField}",`;
  const mapFromFieldString = mapFromField
    ? ` "${mapEntityAlias ? mapEntityAlias : alias}.${mapFromField}",`
    : "";
  const joinEntityClassString = joinEntityClass ? ` "${joinEntityClass}",` : "";
  const joinEntityAliasString = joinEntityAlias ? ` "${joinEntityAlias}",` : "";
  const joinCondition = conditions
    ? `${getLeftJoinAndMapConditions(conditions, joinEntityAlias, alias)}`
    : "";

  return `.${type}(${mapToFieldString}${mapFromFieldString}${joinEntityClassString}${joinEntityAliasString}${joinCondition})`;
};

const getLeftJoinAndMapConditions = (
  conditions: IJoinCondition[],
  joinEntityAlias: string,
  alias: string
) => {
  let conditionString = "";
  let paramValue = "";
  conditions.forEach((c) => {
    const paramName = c.entityFieldToMap
      ? `${c.alias ? c.alias : alias}.${c.entityFieldToMap}`
      : c.queryField
      ? `:${c.queryField}`
      : "";

    conditionString = conditionString
      ? `${conditionString} and ${joinEntityAlias}.${c.joinFieldToMap} ${
          c.operator
        } ${getParamName(c.operator, paramName)}`.trim()
      : `${joinEntityAlias}.${c.joinFieldToMap} ${c.operator} ${getParamName(
          c.operator,
          paramName
        )}`.trim();

    if (c.queryField) {
      if (typeof c.value === "string") {
        c.value = c.value.trim();
      }
      paramValue = paramValue
        ? `${paramValue}, ${getParamValue(c.operator, c.queryField, c.value)}`
        : getParamValue(c.operator, c.queryField, c.value);
    }
  });

  return paramValue
    ? `"${conditionString}", { ${paramValue} }`
    : `"${conditionString}"`;
};

const getParamName = (operator: string, paramName: string) => {
  switch (operator) {
    case "in":
    case "not in":
      return `(${paramName})`;
    default:
      return `${paramName}`;
  }
};

const getParamValue = (operator: string, queryField: string, value: any) => {
  switch (operator) {
    case "like":
      return `${queryField}: '${"%" + value + "%"}'`;
    default:
      if (Array.isArray(value)) {
        const newValue = value.map((v) => `"${v}"`); // format element to "value"
        return `${queryField}: [${newValue}]`;
      }

      return `${queryField}: "${value}"`;
  }
};

export const getInnerJoin = (
  alias: string,
  entityField: string,
  joinAlias: string,
  operator: string,
  innerField: string,
  queryField: string,
  value: any
) => {
  if (typeof value === "string") {
    value = value.trim();
  }
  if (operator === "=") {
    return `.innerJoin("${alias}.${entityField}"
    , "${joinAlias}", "${joinAlias}.${innerField} ${operator} :${queryField}"
    , { ${queryField}: ${value}})`;
  } else if (operator === "like") {
    return `.innerJoin("${alias}.${entityField}"
    , "${joinAlias}", "${joinAlias}.${innerField} ${operator} :${queryField}"
    , { ${queryField}: '${"%" + value + "%"}')`;
  }
};

export const getSkip = (skip: number) => {
  return `.skip(${skip})`;
};

export const getTake = (perPage: number) => {
  return `.take(${perPage})`;
};

export const getOrderBy = (
  entity: string,
  entityField: string,
  orderType: string,
  isFirst: boolean
) => {
  const order = isFirst ? ".orderBy" : ".addOrderBy";
  return `${order}("${entity}.${entityField}", "${orderType}")`;
};

const getJoinConditions = (
  conditions: IJoinCondition[],
  joinEntityAlias: string,
  alias: string
) => {
  let conditionString = "";
  let paramValue = "";
  conditions.forEach((c) => {
    const paramName = c.entityFieldToMap
      ? `${c.alias ? c.alias : alias}.${c.entityFieldToMap}`
      : c.queryField
      ? `:${c.queryField}`
      : "";

    conditionString = conditionString
      ? `${conditionString} and ${joinEntityAlias}.${c.joinFieldToMap} ${
          c.operator
        } ${getParamName(c.operator, paramName)}`.trim()
      : `${joinEntityAlias}.${c.joinFieldToMap} ${c.operator} ${getParamName(
          c.operator,
          paramName
        )}`.trim();

    if (c.queryField) {
      if (typeof c.value === "string") {
        c.value = c.value.trim();
      }
      paramValue = paramValue
        ? `${paramValue}, ${getParamValue(c.operator, c.queryField, c.value)}`
        : getParamValue(c.operator, c.queryField, c.value);
    }
  });

  return paramValue
    ? `"${conditionString}", { ${paramValue} }`
    : `"${conditionString}"`;
};
