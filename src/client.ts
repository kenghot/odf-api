let soap = require("soap");
let url = "http://localhost:3000/counterservice?wsdl";

// Create client
soap.createClient(url, (err, client) => {
  if (err) {
    throw err;
  }
  /*
   * Parameters of the service call: they need to be called as specified
   * in the WSDL file
   */
  // for dataExchange
  const args = {
    TX_ID: "123456787",
    SERVICE_ID: "00",
    REFFERENCE_1: "1231231231231",
    REFFERENCE_2: "00000050",
    METHOD: "DataExchange",
    // METHOD: "DataExchangeConfirm",
    AMOUNT_RECEIVED: "1231",
    SYSTEM_DATE_TIME: "2019/12/01 01:01:01"
  };
  // // for OR
  // const args = {
  //   TX_ID: "123456788",
  //   SERVICE_ID: "00",
  //   REFFERENCE_1: "1231231231231",
  //   REFFERENCE_2: "00000050",
  //   // METHOD: "OR",
  //   METHOD: "ORConfirm",
  //   AMOUNT_RECEIVED: "1231",
  //   R_SERVICE_RUNNO: "123456787",
  //   SYSTEM_DATE_TIME: "2019/12/01 02:02:02"
  // };

  // call the service
  client.CounterServiceOperation(args, (error, res) => {
    if (error) throw error;
    // print the service returned result
    console.log(res);
    return res;
  });
});
