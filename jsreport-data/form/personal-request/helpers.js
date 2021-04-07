function checkType(selected, value) {
  return selected == value ? "checked" : "";
}

function getResidentType0Description(selected, value) {
  return selected == 0 ? currency(value) : "-";
}
function getResidentType1Description(selected, value) {
  return selected == 1 ? currency(value) : "-";
}
function getResidentType99Description(selected, value) {
  return selected == 99 ? value : "-";
}

function checkIsWorking(value){
    return value ? "" : 'checked';
}
