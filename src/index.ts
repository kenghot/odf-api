import * as fs from "fs";
import * as path from "path";
import "reflect-metadata";
import * as soap from "soap";

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

import "../config/env";
import { initDB } from "./db";
import { serviceObject } from "./soap/CounterService";

const main = async () => {
  try {
    await initDB();

    const { initServer } = require("./app");
    const app = await initServer();

    const { jsreport } = require("./jsreport");
    await jsreport.init();

    const xml = fs.readFileSync(
      path.join(__dirname, "./CounterService.wsdl"),
      "utf8"
    );

    soap.listen(app, "/counterservice", serviceObject, xml, () => {
      console.log("soap server initialized");
    });
  } catch (e) {
    console.error(e);
  }
};

main();
