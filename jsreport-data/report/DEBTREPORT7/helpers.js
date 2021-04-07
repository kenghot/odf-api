
function getResult(visitType, isMeetTarget, overdueReasons, dismissReason, isSentBack, reason, isCollectable){
    let letter = '';
    let visit = '';
    if(isSentBack || reason || isCollectable) letter = `${isSentBack}: ${reason} ${isCollectable}`
    if(visitType  || isMeetTarget || overdueReasons || dismissReason) visit = `${visitType}: ${isMeetTarget} ${overdueReasons} ${dismissReason}`

    if (letter && visit) return `${letter} / ${visit}`
    if (letter) return letter;
    if (visit) return visit;

    return ""
   
}