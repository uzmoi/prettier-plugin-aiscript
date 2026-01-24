import type { Doc, ParserOptions } from "prettier";
import type * as dst from "../dst";

export const semi = (
	node: dst.Statement | dst.NamespaceItem | dst.TopLevel,
	options: ParserOptions<dst.Node>,
): Doc => {
	if (node.type === "Namespace" || node.type === "Meta") return "";
	return options.semi && shouldSemi(node) ? ";" : "";
};

const shouldSemi = (statement: dst.Statement): boolean => {
	switch (statement.type) {
		// 必ずブロックで終わるならセミコロン不要
		case "FnDefinition":
		case "Loop":
		case "Block": {
			return false;
		}
		// Statementで終わるならそのStatementに依存する
		case "Each":
		case "For":
		case "While": {
			return shouldSemi(statement.body);
		}
		case "ExpressionStatement": {
			return shouldSemiToExpression(statement.expression);
		}
		default: {
			return true;
		}
	}
};

const shouldSemiToExpression = (expression: dst.Expression): boolean => {
	switch (expression.type) {
		case "UnaryOperator": {
			return shouldSemiToExpression(expression.body);
		}
		case "BinaryOperator": {
			return shouldSemiToExpression(expression.rhs);
		}
		case "If": {
			return shouldSemi(
				expression.else ?? expression.elseif.at(-1)?.then ?? expression.then,
			);
		}
		case "Match":
		case "EvalBlock": {
			return false;
		}
		default: {
			return true;
		}
	}
};
