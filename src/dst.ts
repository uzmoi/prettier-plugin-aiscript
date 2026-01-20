export interface Loc {
	start: number;
	end: number;
}

export interface Comment extends NodeBase {
	type: "Comment";
	value: string;
	nodeDescription?: string;
	placement?: "ownLine" | "endOfLine" | "remaining";
	leading?: boolean;
	trailing?: boolean;
	printed?: boolean;
}

export interface NodeBase<T extends string = string> {
	type: T;
	loc: Loc;
	comments?: Comment[];
}

interface FnBase extends NodeBase {
	params: FnParameter[];
	returnTy: Ty | null;
	body: Block;
}

export interface FnParameter extends NodeBase {
	type: "FnParameter";
	dest: Expression;
	ty: Ty | null;
	optional: boolean;
	default: Expression | null;
}

export type Node = Script | TopLevel | Statement | Expression | Ty | Comment;

export interface Script extends NodeBase {
	type: "Script";
	body: (TopLevel | Statement)[];
}

export type TopLevel = Namespace | Meta;

export interface Namespace extends NodeBase {
	type: "Namespace";
	name: Identifier;
	body: NamespaceItem[];
}

export type NamespaceItem = Namespace | VariableDefinition | FnDefinition;

export interface Meta extends NodeBase {
	type: "Meta";
	name: Identifier | null;
	value: Expression;
}

export type Statement =
	| Assignment
	| VariableDefinition
	| FnDefinition
	| Return
	| Each
	| For
	| Loop
	| While
	| Break
	| Continue
	| Out
	| ExpressionStatement
	| Block;

export interface Assignment extends NodeBase {
	type: "Assignment";
	operator: "=" | "+=" | "-=";
	dest: Expression;
	value: Expression;
}

export interface VariableDefinition extends NodeBase {
	type: "VariableDefinition";
	mutable: boolean;
	dest: Expression;
	ty: Ty | null;
	init: Expression;
}

export interface FnDefinition extends FnBase {
	type: "FnDefinition";
	name: Identifier;
}

export interface Return extends NodeBase {
	type: "Return";
	body: Expression;
}

export interface Each extends NodeBase {
	type: "Each";
	definition: VariableDefinition;
	source: Expression;
	body: Statement;
}

export interface For extends NodeBase {
	type: "For";
	enumerator:
		| { type: "Times"; times: Expression }
		| {
				type: "Range";
				definition: VariableDefinition;
				from: Expression | null;
				to: Expression;
		  };
	body: Statement;
}

export interface Loop extends NodeBase {
	type: "Loop";
	body: Block;
}

export interface While extends NodeBase {
	type: "While";
	do: boolean;
	condition: Expression;
	body: Statement;
}

export interface Break extends NodeBase {
	type: "Break";
}

export interface Continue extends NodeBase {
	type: "Continue";
}

export interface Out extends NodeBase {
	type: "Out";
	body: Expression;
}

export interface ExpressionStatement extends NodeBase {
	type: "ExpressionStatement";
	expression: Expression;
}

export interface Block extends NodeBase {
	type: "Block";
	body: Statement[];
}

export type Expression =
	| Identifier
	| Literal
	| Template
	| UnaryOperator
	| BinaryOperator
	| Fn
	| Call
	| Index
	| Prop
	| If
	| Match
	| EvalBlock;

export interface Identifier extends NodeBase {
	type: "Identifier";
	name: string;
}

export type Literal =
	| NullLiteral
	| BoolLiteral
	| NumberLiteral
	| StringLiteral
	| ArrayLiteral
	| ObjectLiteral;

export interface NullLiteral extends NodeBase {
	type: "NullLiteral";
}

export interface BoolLiteral extends NodeBase {
	type: "BoolLiteral";
	value: boolean;
}

export interface NumberLiteral extends NodeBase {
	type: "NumberLiteral";
	value: number;
}

export interface StringLiteral extends NodeBase {
	type: "StringLiteral";
	value: string;
}

export interface Template extends NodeBase {
	type: "Template";
	parts: (TemplatePart | Expression)[];
}

export interface TemplatePart extends NodeBase {
	type: "TemplatePart";
	content: string;
}

export interface ArrayLiteral extends NodeBase {
	type: "ArrayLiteral";
	elements: Expression[];
}

export interface ObjectLiteral extends NodeBase {
	type: "ObjectLiteral";
	properties: ObjectProperty[];
}

export interface ObjectProperty extends NodeBase {
	type: "ObjectProperty";
	key: Identifier;
	value: Expression;
}

export interface UnaryOperator extends NodeBase {
	type: "UnaryOperator";
	operator: "!" | "+" | "-" | "exists";
	body: Expression;
}

export interface BinaryOperator extends NodeBase {
	type: "BinaryOperator";
	operator:
		| ("&&" | "||")
		| ("==" | "!=")
		| (">" | ">=" | "<" | "<=")
		| ("+" | "-" | "*" | "/" | "%" | "^");
	rhs: Expression;
	lhs: Expression;
}

export interface Fn extends FnBase {
	type: "Fn";
}

export interface Call extends NodeBase {
	type: "Call";
	callee: Expression;
	args: Expression[];
}

export interface Index extends NodeBase {
	type: "Index";
	target: Expression;
	index: Expression;
}

export interface Prop extends NodeBase {
	type: "Prop";
	target: Expression;
	name: Identifier;
}

export interface If extends NodeBase {
	type: "If";
	condition: Expression;
	then: Statement;
	elseif: ElseIf[];
	else: Statement | null;
}

export interface ElseIf extends NodeBase {
	type: "ElseIf";
	condition: Expression;
	then: Statement;
}

export interface Match extends NodeBase {
	type: "Match";
	value: Expression;
	cases: MatchCase[];
}

export interface MatchCase extends NodeBase {
	type: "MatchCase";
	pattern: Expression | null;
	body: Statement;
}

export interface EvalBlock extends NodeBase {
	type: "EvalBlock";
	body: Block;
}

export type Ty = TypeReference | FnType | UnionType;

export interface TypeReference extends NodeBase {
	type: "TypeReference";
	name: Identifier;
	argument: Ty | null;
}

export interface FnType extends NodeBase {
	type: "FnType";
	params: Ty[];
	return: Ty;
}

export interface UnionType extends NodeBase {
	type: "UnionType";
	union: Ty[];
}
