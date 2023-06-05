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
			"@typescript-eslint": tsEslintPlugin
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
			"sort-imports": ["error", {
				"ignoreCase": false,
				"ignoreDeclarationSort": false,
				"ignoreMemberSort": false,
				// "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
				"allowSeparatedGroups": false
			}],

			// Layout & Formatting

			"array-bracket-newline": ["error", "consistent"],
			"arrow-parens": ["error", "as-needed", {
				"requireForBlockBody": true
			}],
			"arrow-spacing": ["error", {
				"before": true,
				"after": true
			}],
			// "block-spacing": ["error", "always"], override by @typescript-eslint
			// "brace-style": ["error", "1tbs"], override by @typescript-eslint
			// "comma-dangle": ["error", "never"], override by @typescript-eslint
			// "comma-spacing": ["error", { override by @typescript-eslint
			// 	"before": false,
			// 	"after": true
			// }],
			"comma-style": ["error", "last"],
			"computed-property-spacing": ["error", "never"],
			"dot-location": ["error", "property"],
			"eol-last": ["error", "always"],
			// "func-call-spacing": ["error", "never"], override by @typescript-eslint
			"function-paren-newline": ["error", "multiline"],
			"implicit-arrow-linebreak": ["error", "beside"],
			// "indent": ["error", "tab"], override by @typescript-eslint
			// "key-spacing": ["error", { override by @typescript-eslint
			// 	"beforeColon": false,
			// 	"afterColon": true,
			// 	"mode": "strict"
			// }],
			// "keyword-spacing": ["error", { override by @typescript-eslint
			// 	"before": true,
			// 	"after": true
			// }],
			"linebreak-style": ["error", "unix"],
			"max-len": ["warn", {
				"code": 119,
				"tabWidth": 4
			}],
			"new-parens": ["error", "always"],
			"no-trailing-spaces": ["error", {
				"skipBlankLines": false,
				"ignoreComments": false
			}],
			"no-whitespace-before-property": ["error"],
			"object-curly-newline": ["error", {
				"consistent": true
			}],
			"padded-blocks": ["error", "never", {
				"allowSingleLineBlocks": false
			}],
			// "quotes": ["error", "double", { override by @typescript-eslint
			// 	"avoidEscape": false,
			// 	"allowTemplateLiterals": false
			// }],
			"rest-spread-spacing": ["error", "never"],
			// "semi": ["error", "always"], override by @typescript-eslint
			"semi-spacing": ["error", {
				"before": false,
				"after": true
			}],
			"semi-style": ["error", "last"],
			// "space-before-blocks": ["error", "always"], override by @typescript-eslint
			// "space-before-function-paren": ["error", { override by @typescript-eslint
			// 	"anonymous": "never",
			// 	"named": "never",
			// 	"asyncArrow": "always"
			// }],
			"space-in-parens": ["error", "never"],
			"space-infix-ops": ["error"],
			"space-unary-ops": ["error", {
				"words": true,
				"nonwords": false
			}],
			"switch-colon-spacing": ["error", {
				"before": false,
				"after": true
			}],
			"template-curly-spacing": ["error", "never"],
			"template-tag-spacing": ["error", "never"],
			"unicode-bom": ["error", "never"],

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
			"@typescript-eslint/type-annotation-spacing": ["error"],

			// Extensions

			"block-spacing": ["off"],
			"@typescript-eslint/block-spacing": ["error", "never"],
			"brace-style": ["off"],
			"@typescript-eslint/brace-style": ["error", "1tbs"],
			"comma-dangle": ["off"],
			"@typescript-eslint/comma-dangle": ["error", "never"],
			"comma-spacing": ["off"],
			"@typescript-eslint/comma-spacing": ["error", {
				"before": false,
				"after": true
			}],
			"func-call-spacing": ["off"],
			"@typescript-eslint/func-call-spacing": ["error", "never"],
			"indent": ["off"],
			"@typescript-eslint/indent": ["error", "tab"],
			"key-spacing": ["off"],
			"@typescript-eslint/key-spacing": ["error", {
				"beforeColon": false,
				"afterColon": true,
				"mode": "strict"
			}],
			"keyword-spacing": ["off"],
			"@typescript-eslint/keyword-spacing": ["error", {
				"before": true,
				"after": true
			}],
			"quotes": ["off"],
			"@typescript-eslint/quotes": ["error", "double", {
				"avoidEscape": false,
				"allowTemplateLiterals": false
			}],
			"semi": ["off"],
			"@typescript-eslint/semi": ["error", "always"],
			"space-before-blocks": ["off"],
			"@typescript-eslint/space-before-blocks": ["error", "always"],
			"space-before-function-paren": ["off"],
			"@typescript-eslint/space-before-function-paren": ["error", {
				"anonymous": "never",
				"named": "never",
				"asyncArrow": "always"
			}],
		}
	}
];
