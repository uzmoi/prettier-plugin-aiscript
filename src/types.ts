import type prettier from "prettier";
import type { Ast } from "@syuilo/aiscript";
import type { Node, Root } from "./node";

export interface AstPath<T = Node>
	extends Omit<
		prettier.AstPath<Node>,
		"node" | "stack" | "call" | "map" | "each"
	> {
	node: [T] extends [Ast.Node] ? T & Node : T;
	root: Root;

	stack: (string | number | Node | Node[])[];

	call<U, P1 extends KeyOfType<T>>(
		callback: (path: AstPath<Get<T, P1>>) => U,
		prop1: P1,
	): U;
	call<U, P1 extends KeyOfType<T>, P2 extends KeyOfType<Get<T, P1>>>(
		callback: (path: AstPath<Get<Get<T, P1>, P2>>) => U,
		prop1: P1,
		prop2: P2,
	): U;

	map<U>(callback: (path: AstPath<GetIndex<T>>, index: number) => U): U[];
	map<U, P1 extends KeyOfType<T, readonly unknown[]>>(
		callback: (path: AstPath<GetIndex<Get<T, P1>>>, index: number) => U,
		prop1: P1,
	): U[];

	each(callback: (path: AstPath<GetIndex<T>>, index: number) => void): void;
	each<P1 extends KeyOfType<T, readonly unknown[]>>(
		callback: (path: AstPath<GetIndex<Get<T, P1>>>, index: number) => void,
		prop1: P1,
	): void;
}

type Get<T, K extends KeyOfType<T>> =
	T extends T ? NonNullable<T[Extract<K, keyof T>]> : never;

type GetIndex<T> = Extract<T, readonly unknown[]>[number];

type KeyOfType<T, U = unknown> =
	T extends readonly unknown[] ? Extract<keyof T, number>
	:	{
			[P in keyof T]-?: NonNullable<T[P]> extends U ? P : never;
		}[keyof T];
