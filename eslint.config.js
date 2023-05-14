import eslint from "@eslint/js";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsEslintParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
	eslint.configs.recommended,

	{
		files: ["src/index.ts"],

		languageOptions: {
			ecmaVersion: 2022,

			globals: {
				...globals.node,
				...globals.es2022
			},

			parser: tsEslintParser
		},

		linterOptions: {
			noInlineConfig: true,
			reportUnusedDisableDirectives: true
		},

		plugins: {
			"@typescript-eslint": tsEslintPlugin
		},

		rules: {
			"eqeqeq": ["error", "always"],
			"func-style": ["error", "declaration", { "allowArrowFunctions": true }],
			"no-eval": ["error", { "allowIndirect": false }],
			"no-floating-decimal": ["error"],
			"no-implied-eval": ["error"],
			"no-multi-str": ["error"],
			"no-octal-escape": ["error"],
			"no-param-reassign": ["error"],
			"no-var": ["error"],
			"operator-assignment": ["error", "always"],
			"prefer-arrow-callback": ["error", { "allowNamedFunctions": false, "allowUnboundThis": true }],
			"prefer-const": ["error", { "destructuring": "any", "ignoreReadBeforeAssign": false }],
			"prefer-exponentiation-operator": ["error"],
			"prefer-named-capture-group": ["error"],
			"prefer-numeric-literals": ["error"],
			"prefer-regex-literals": ["error", { "disallowRedundantWrapping": true }],
			"prefer-rest-params": ["error"],
			"prefer-spread": ["error"],
			"prefer-template": ["error"],
			"quote-props": ["error", "as-needed", { "keywords": true, "unnecessary": true, "numbers": false }],
			"radix": ["error", "always"],
			"sort-imports": ["error", {
				"ignoreCase": false,
				"ignoreDeclarationSort": false,
				"ignoreMemberSort": false,
				"memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
				"allowSeparatedGroups": false
			}]
		}
	}
];
