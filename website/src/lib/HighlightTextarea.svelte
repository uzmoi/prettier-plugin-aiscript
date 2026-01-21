<script lang="ts" module>
	declare module "svelte/elements" {
		interface HTMLTextareaAttributes {
			autocorrect?: string;
		}
	}
</script>

<script lang="ts">
	import { LinesAndColumns } from "lines-and-columns";
	import { type Token, tokenize } from "./tokenizer";

	export let value = "";
	export let readonly = false;
	export let errorPos: { line: number; column: number } | null = null;

	let lines: (Token & { column: number })[][];
	$: {
		lines = [];
		const tokens = tokenize(value);
		let column = 0;
		let line: (Token & { column: number })[] = [];
		for (const { type, value } of tokens) {
			const [firstValue, ...tokenLines] = value.split("\n");
			line.push({ type, value: firstValue, column });
			column += firstValue.length;
			for (const value of tokenLines) {
				lines.push(line);
				line = [{ type, value, column: 0 }];
				column = value.length;
			}
		}
		lines.push(line);
	}

	$: linesAndColumns = new LinesAndColumns(value);
	let selection: [number] | [number, number] = [0];
	const handleSelectionChange = (e: Event) => {
		const { selectionStart: start, selectionEnd: end } =
			e.currentTarget as HTMLTextAreaElement;

		selection = start === end ? [start] : [start, end];
	};
</script>

<div class="container">
	<div class="sticky-header">
		<div class="selection-location">
			{selection
				.map(index => {
					const location = linesAndColumns.locationForIndex(index);
					if (location == null) return "?";
					return `line ${location.line + 1}, column ${location.column + 1}`;
				})
				.join(" ~ ")}
		</div>
	</div>
	<textarea
		bind:value
		on:input={handleSelectionChange}
		on:selectionchange={handleSelectionChange}
		{readonly}
		class="code"
		autocomplete="off"
		autocapitalize="off"
		autocorrect="off"
		spellcheck="false"
	></textarea>
	<div class="highlight code" aria-hidden="true">
		{#each lines as tokens, index}
			{@const line = index + 1}
			<div>
				<div class="line-number" data-error={errorPos?.line === line}>
					{line}
				</div>
				<div class="line-content">
					{#each tokens as token}
						<span
							data-token={token.type}
							data-column={token.column}
							data-error={errorPos?.line === line &&
								token.column < errorPos.column &&
								errorPos.column <= token.column + token.value.length}
						>
							{token.value}
						</span>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		position: relative;
		background-color: #333;
	}

	.sticky-header {
		position: sticky;
		z-index: 1;
		top: 0;
	}

	.selection-location {
		position: absolute;
		right: 0;
		padding: 0 0.5em;
		font-size: 14px;
		color: #ccc;
		background-color: #3338;
		pointer-events: none;
		opacity: 0;
		transition: opacity 100ms;
	}

	.container:focus-within .selection-location {
		opacity: 1;
	}

	.code {
		font-family: "Inconsolata", monospace;
		font-size: 14px;
		padding: 0.6em;
		padding-left: 3.5em;
		line-break: anywhere;
	}

	textarea {
		position: absolute;
		inset: 0;
		padding: inherit;
		overflow: hidden;
		background-color: transparent;
		border: none;
		outline: none;
		appearance: none;
		font: inherit;
		color: transparent;
		text-align: inherit;
		text-indent: inherit;
		text-transform: inherit;
		letter-spacing: inherit;
		resize: none;
		white-space: pre-wrap;
		word-spacing: inherit;
		caret-color: white;
	}

	.highlight {
		position: relative;
		min-height: 1em;
		pointer-events: none;
		user-select: none;
	}

	.line-number {
		position: absolute;
		left: 0;
		text-align: right;
		width: 3em;
		padding-inline: 0.25em;
		border-right: 1px solid #888;
		color: #ccc;
		overflow-wrap: normal;
	}

	.line-number[data-error="true"] {
		background-color: #a22;
	}

	.line-content {
		display: inline-block;
		white-space: pre-wrap;
	}

	.line-content [data-error="true"] {
		text-decoration: underline wavy red;
	}

	::selection {
		background-color: #68ca;
	}

	[data-token="ident"] {
		color: #dee;
	}
	[data-token="keyword"] {
		color: #e64;
	}
	[data-token="ns"] {
		color: #ca8;
	}
	[data-token="num"] {
		color: #6ce;
	}
	[data-token="str"],
	[data-token="template"] {
		color: #8ca;
	}
	[data-token="comment"] {
		color: #999;
	}
	[data-token="delim"] {
		color: #8ac;
	}
	[data-token="mark"] {
		color: #c8a;
	}
</style>
