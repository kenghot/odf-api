
function getPageNumber (pageIndex) {
    if (pageIndex == null) {
        return ''
    }
    
    const pageNumber = pageIndex + 1
    
    return pageNumber
}
function getTotalPages (pages) {
    if (!pages) {
        return ''
    }
    
    return pages.length
}
function displayBarcode(value) {
    return value ? `display:block;position:absolute;right:100` : "display:none"
}