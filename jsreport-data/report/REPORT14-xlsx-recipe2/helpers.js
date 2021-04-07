function isFirstOfProvince(data, index) {
    const length = data.length;
    if(index === 0 || data[index].province !== data[index-1].province ) {
        return true;
    } else {
        return false;
    }
}

function isFirstOfOrgName(data, index) {
    const length = data.length;
    if(index === 0 || data[index].orgName !== data[index-1].orgName ) {
        return true;
    } else {
        return false;
    }
}

function renderFirstProvinceText(data, index) {
    const length = data.length;    
    return isFirstOfProvince(data, index) ? data[index].province : "";
}

function renderFirstOrgNameText(data, index) {
    const length = data.length;    
    return isFirstOfOrgName(data, index) ? data[index].orgName : "";
}