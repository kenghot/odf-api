function checkEmptyReturnDashed(value) {
  return value || value === 0 ? value : "-";
}

function checkEmptyReturnSpace(value) {
  return value || value === 0 ? value : "&nbsp";
}

function checkOccupationDescription(name, description) {
  const des = description ? ` : ${description}` : "";
  return name  ? name+des : "-";
}

function checkEmpty(value) {
  return value || value === 0 ? value :  "";
}

function checkYearMonthText(year, month) {
  const yearText = year ? `${year}ปี` : "";
  const monthText = month ? `${month}เดือน` : "";
  const yearMonth = `${yearText}${monthText}`;
  return yearMonth ? yearMonth : "";
}

function currency(value, hideDashed=false) {
  const _n = 2;
  const _x = 3;
  if (value) {
    const calVal = value instanceof Number ? value : +value;
    const re = "\\d(?=(\\d{" + _x + "})+" + (_n > 0 ? "\\." : "$") + ")";
    const curVal = calVal
      .toFixed(Math.max(0, ~~_n))
      .replace(new RegExp(re, "g"), "$&,");
      
    if (curVal === null || curVal === "NaN") return hideDashed === true ? "0.00" : dashed("0.00");

    return hideDashed === true? curVal : dashed(curVal);
  } else {
    return hideDashed === true? "0.00" : dashed("0.00");
  }
}

function dashed(value) {
   return value ? "‒ " + value + " ‒" : "‒" ;  
}

function range(n) {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(i);
  }
  return result;
}

function getOrderNumber(index) {
  return +index + 1;
}
function checkType(selected, value) {
  return selected == value ? "checked" : "";
}

function formatThaiDate(date, returnEmptyStringIfEmpty = true , isOnlyBirthYear = false) {
  var monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม",
    "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม",
    "สิงหาคม", "กันยายน", "ตุลาคม",
    "พฤศจิกายน", "ธันวาคม"
  ];

  if(date) {
    var dateObj = new Date(date);
    var day = dateObj.getDate();
    var monthIndex = dateObj.getMonth();
    var year = dateObj.getFullYear();
    if(isOnlyBirthYear === true){
      return "พ.ศ."+ ' ' + (formatThaiYear(date,returnEmptyStringIfEmpty));
    }else{
      return day + ' ' + monthNames[monthIndex] + ' ' + (formatThaiYear(date,returnEmptyStringIfEmpty));
    }
  } else {
    return returnEmptyStringIfEmpty ? "" : "-";
  }
}

function formatThaiYear(date, returnEmptyStringIfEmpty = true) {
  if(date) {
    var dateObj = new Date(date);
    return dateObj.getFullYear() + 543;
  } else {
    return returnEmptyStringIfEmpty ? "" : "-";
  }
}

// Region Logic 

function isFirstOfRegion(data, index) {
    const length = data.length;
    if(index === 0 || data[index].region !== data[index-1].region ) {
        return true;
    } else {
        return false;
    }
}

function isLastOfRegion(data, index) {
   const isLast = index === data.length - 1;
    if(isLast || data[index].region !== data[index+1].region ) {
        return true;
    } else {
        return false;
    }
}

function renderRegionText(data, index) {
    const length = data.length;    
    return isFirstOfRegion(data, index) ? data[index].region : "";
}

let dataObj = {};
let dataObjTotal = {};
let showTotal = false

function calculateSummaryRow(arr, index) {
    const selectedObj = arr[index];
    for (var key in selectedObj) {
      if (selectedObj.hasOwnProperty(key)) {
        if (!dataObj.hasOwnProperty(key)) {
          dataObj[key] = 0;
        } 
        dataObj[key] += +selectedObj[key];
      }
    }
}


function calculateTotalSummaryRow(arr, index) {
    const selectedObj = arr[index];
    for (var key in selectedObj) {
      if (selectedObj.hasOwnProperty(key)) {
        if (!dataObjTotal.hasOwnProperty(key)) {
          dataObjTotal[key] = 0;
        } 
        dataObjTotal[key] += +selectedObj[key];
      }
    }
}

function renderSummaryRow(fieldName) {
    return checkEmpty(dataObj[fieldName]);
}

function renderTotalSummaryRow(fieldName) {
    return checkEmpty(dataObjTotal[fieldName]);
}

function resetSummaryData(arr, index) {
    const isLast = index === arr.length - 1;
    if(!isLast && arr[index].region !== arr[index+1].region){
        dataObj = {};
        showTotal = true
    }
}

function isShowTotal(){
  if(showTotal){
    return true
  } else {
    return false
  }

}
