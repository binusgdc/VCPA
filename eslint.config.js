import eslint from "@eslint/js";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsEslintParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginImport from "eslint-plugin-import";
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

			parser: tsEslintParser,
			parserOptions: {
				ecmaVersion: 2022,
				project: "tsconfig.json"
			}
		},

		linterOptions: {
			// noInlineConfig: true,
			reportUnusedDisableDirectives: true
		},

		plugins: {
			"@typescript-eslint": tsEslintPlugin,
			"eslint-plugin-import": eslintPluginImport,
		},

		rules: {
			// ESLint

			// Possible Problems

			"no-constructor-return": ["error"],
			"no-duplicate-imports": ["error"],
			"no-new-native-nonconstructor": ["error"],
			"no-promise-executor-return": ["error"],
			"no-self-compare": ["error"],
			"no-template-curly-in-string": ["error"],
			"no-unmodified-loop-condition": ["error"],
			"no-unused-private-class-members": ["error"],
			"require-atomic-updates": ["error"],

			// Suggestions

			"arrow-body-style": ["error", "as-needed", {
				"requireReturnForObjectLiteral": true
			}],
			"eqeqeq": ["error", "always"],
			"func-style": ["error", "declaration", {
				"allowArrowFunctions": true
			}],
			"no-eval": ["error", { "allowIndirect": false }],
			"no-floating-decimal": ["error"],
			"no-implied-eval": ["error"],
			"no-multi-str": ["error"],
			"no-octal-escape": ["error"],
			"no-param-reassign": ["error"],
			"no-var": ["error"],
			"operator-assignment": ["error", "always"],
			"prefer-arrow-callback": ["error", {
				"allowNamedFunctions": false,
				"allowUnboundThis": true
			}],
			"prefer-const": ["error", {
				"destructuring": "any",
				"ignoreReadBeforeAssign": false
			}],
			"prefer-exponentiation-operator": ["error"],
			"prefer-named-capture-group": ["error"],
			"prefer-numeric-literals": ["error"],
			"prefer-regex-literals": ["error", {
				"disallowRedundantWrapping": true
			}],
			"prefer-rest-params": ["error"],
			"prefer-spread": ["error"],
			"prefer-template": ["error"],
			"quote-props": ["error", "as-needed", {
				"keywords": true,
				"unnecessary": true,
				"numbers": false
			}],
			"radix": ["error", "always"],

			// @typescript-eslint/eslint-plugin

			...tsEslintPlugin.configs["recommended"].rules,
			...tsEslintPlugin.configs["recommended-requiring-type-checking"].rules,

			"@typescript-eslint/explicit-member-accessibility": ["error", {
				"accessability": "explicit"
			}],
			"@typescript-eslint/member-delimiter-style": ["error", {
				"multiline": {
					"delimiter": "semi",
					"requireLast": true
				},
				"singleline": {
					"delimiter": "semi",
					"requireLast": true
				}
			}],
			"@typescript-eslint/no-inferrable-types": ["off"],
			"@typescript-eslint/no-require-imports": ["error"],
			"@typescript-eslint/no-unsafe-declaration-merging": ["error"],
			"@typescript-eslint/no-unsafe-enum-comparison": ["error"],
			"@typescript-eslint/parameter-properties": ["error", {
				"prefer": "parameter-property"
			}],
			"@typescript-eslint/prefer-literal-enum-member": ["error"],
			"@typescript-eslint/prefer-optional-chain": ["error"],
			"@typescript-eslint/prefer-string-starts-ends-with": ["error"],
			"@typescript-eslint/prefer-ts-expect-error": ["error"],
			"@typescript-eslint/require-array-sort-compare": ["error", {
				"ignoreStringArrays": true
			}],

			// eslint-plugin-import

			...eslintPluginImport.configs.recommended,
			...eslintPluginImport.configs.typescript,

			// Helpful warnings

			"import/no-deprecated": ["error"],
			"import/no-empty-named-blocks": ["error"],

			// Module systems

			// Static analysis

			"import/no-absolute-path": ["error"],
			"import/no-self-import": ["error"],

			// Style guide

			"import/first": ["error"],
			"import/newline-after-import": ["error", {
				"considerComments": true
			}],
			"import/order": ["error", {
				"groups": [
					["builtin", "external"],
					"internal",
					["parent", "sibling", "index"],
					"type",
					"object"
				],
				"newlines-between": "always",
				"alphabetize": {
					"order": "asc",
					"orderImportKind": "asc",
					"caseInsensitive": false
				}
			}]
		}
	},

	eslintConfigPrettier
];
