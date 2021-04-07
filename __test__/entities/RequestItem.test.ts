import { RequestItem } from "../../src/entities/RequestItem";
// import * as data from "../../mock-data/request.json";
const data = require("../../mock-data/request.json");

const ri = new RequestItem();

beforeEach(() => {
    ri.borrower = data[0].request_items[0].borrower;
    ri.guarantor = data[0].request_items[0].guarantor;
});

test("getAge", () => {
    ri.setAge("2041-12-07");
    expect(ri.borrower.age).toBe(59);

    ri.setAge("2041-12-08");
    expect(ri.borrower.age).toBe(60);
});
