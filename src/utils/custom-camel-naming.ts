import { DefaultNamingStrategy, NamingStrategyInterface } from "typeorm";
import { camelCase } from "typeorm/util/StringUtils";

const pascalCase = require("pascal-case");

export class CustomCamelNamingStrategy extends DefaultNamingStrategy
    implements NamingStrategyInterface {
    columnName(
        propertyName: string,
        customName: string,
        embeddedPrefixes: string[]
    ): string {
        // todo: simplify
        if (embeddedPrefixes.length) {
            return (
                camelCase(embeddedPrefixes.join("_")) +
                (customName ? customName : pascalCase(propertyName))
            );
        }

        return customName ? customName : propertyName;
    }
}
