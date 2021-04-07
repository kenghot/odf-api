export const setNestedObject = (nestedObj, pathArr, value: any) => {
  return pathArr.reduce((obj, key, index) => {
    if (index === pathArr.length - 1) {
      obj[key] = value;
    }
    return obj && obj[key] !== "undefined" ? obj[key] : undefined;
  }, nestedObj) as object;
};

export const flattenObject = (
  nestedObj,
  targetkey,
  isArray: boolean,
  flatObj: any
) => {
  // tslint:disable-next-line: no-unused-expression
  (Object.keys(nestedObj).forEach((key, index) => {
    if (key === targetkey && nestedObj[key] !== null) {
      if (isArray) {
        flatObj.push(...nestedObj[key]);
      } else {
        flatObj.push(nestedObj[key]);
      }
      return;
    }
    if (nestedObj[key] && typeof nestedObj[key] === "object") {
      const f = flattenObject(nestedObj[key], targetkey, isArray, flatObj);
      flatObj.concat(f);
    }
  }) as unknown) as object;
  return flatObj;
};
