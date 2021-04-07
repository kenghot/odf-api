const channelObj = {
    ['1']: "Counter Bank",
    ['2']: "ATM",
    ['3']: "Internet",
    ['4']: "Telephone Banking",
    ['5']: "Corporate Banking",
    ['7']: "mWallet",
    ['8']: "Mobile Banking",
    ['9']: "Mobile USSD"
}

function getChannel(channel){
    return channelObj[channel] ? channelObj[channel] : ""
}
