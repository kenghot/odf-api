let faceSheetItemsObj;

function setFactSheetItems(faceSheetItems) {
    faceSheetItemsObj = JSON.parse(faceSheetItems);
}

function renderPropertiesGroup(creditScrollCriteriaIndex, criteriaListIndex) {
    try {
        return faceSheetItemsObj.credit_scroll_criteria[creditScrollCriteriaIndex].criteria_list[criteriaListIndex].result_score;
    } catch(e){
        return "";
    }
}