import { User } from "../../src/entities/User";

const data = require("../../mock-data/user.json");

const user = new User();

beforeEach(() => {
    user.username = data[0].username;
    user.email = data[0].email;
    user.password = data[0].password;
    user.confirmPassword = data[0].confirmPassword;
    user.resetPasswordToken = "12345";
    user.resetPasswordTokenExpiration = 12345;
});

test("comparePassword", async () => {
    try {
        await user.doSomethingBeforeInsert();
        const isMatch = await user.comparePassword("12345678");

        expect(isMatch).toBe(true);
        expect(user.password).toBeFalsy();
        expect(user.confirmPassword).toBeFalsy();
        expect(user.resetPasswordToken).toBeFalsy();
        expect(user.resetPasswordTokenExpiration).toBeFalsy();
    } catch (e) {
        throw e;
    }
});

test("doSomethingBeforeInsert", async () => {
    try {
        await user.doSomethingBeforeInsert();

        expect(user.confirmPassword).toBeFalsy();
        expect(user.resetPasswordToken).toBeFalsy();
        expect(user.resetPasswordTokenExpiration).toBe(-1);
    } catch (e) {
        throw e;
    }
});

test("doSomethingAfterInsert", () => {
    user.doSomethingAfterInsert();

    expect(user.password).toBeFalsy();
    expect(user.confirmPassword).toBeFalsy();
    expect(user.resetPasswordToken).toBeFalsy();
    expect(user.resetPasswordTokenExpiration).toBeFalsy();
});

test("doSomethingBeforeUpdate with password", async () => {
    try {
        await user.doSomethingBeforeUpdate();

        expect(user.confirmPassword).toBeFalsy();
        expect(user.resetPasswordToken).toBeFalsy();
        expect(user.resetPasswordTokenExpiration).toBe(-1);
    } catch (e) {
        throw e;
    }
});

test("doSomethingBeforeUpdate without password", async () => {
    try {
        delete user.password;
        delete user.confirmPassword;

        await user.doSomethingBeforeUpdate();

        expect(user.resetPasswordToken).toBeTruthy();
        expect(user.resetPasswordTokenExpiration).not.toBe(-1);
    } catch (e) {
        throw e;
    }
});

test("doSomethingAfterUpdate", () => {
    user.doSomethingAfterUpdate();

    expect(user.password).toBeFalsy();
    expect(user.confirmPassword).toBeFalsy();
    expect(user.resetPasswordToken).toBeFalsy();
    expect(user.resetPasswordTokenExpiration).toBeFalsy();
});
