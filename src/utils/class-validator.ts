import {
    registerDecorator,
    validate,
    ValidationArguments,
    ValidationOptions,
    ValidatorOptions
} from "class-validator";
import { ValidateError } from "../middlewares/error/error-type";

export function IsEqualToField(
    property: string,
    validationOptions?: ValidationOptions
) {
    return function(object: Object, propertyName: string) {
        registerDecorator({
            name: "isEqualToField",
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[
                        relatedPropertyName
                    ];
                    return value === relatedValue;
                }
            }
        });
    };
}

export const validateFields = async (
    obj: any,
    validatorOptions?: ValidatorOptions
) => {
    try {
        const err = await validate(obj, validatorOptions);
        if (err.length > 0) throw err;

        return;
    } catch (e) {
        const keys = Object.keys(e[0].constraints);
        throw new ValidateError({ message: e[0].constraints[keys[0]] });
    }
};
