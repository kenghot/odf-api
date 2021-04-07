function checkMemoInformerRelationshipType(memoInformer, selectedValue, value) {
    if(memoInformer === selectedValue)   {
       return value;
    }
    else {
        return "-"
    }
}