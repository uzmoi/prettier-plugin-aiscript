<script lang="ts">
	import { LinesAndColumns } from "lines-and-columns";
	import { type Token, tokenize } from "./tokenizer";

	export let value = "";
	export let readonly = false;

	let lines: Token[][];
	$: {
		lines = [];
		const tokens = tokenize(value);
		let line: Token[] = [];
		for (const { type, value } of tokens) {
			const [firstValue, ...tokenLines] = value.split("\n");
			line.push({ type, value: firstValue });
			for (const value of tokenLines) {
				lines.push(line);
				line = [{ type, value }];
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
	/>
	<div class="highlight code" aria-hidden="true">
		{#each lines as tokens, index}
			<div>
				<div class="line-number">{index + 1}</div>
				<div class="line-content">
					{#each tokens as token}
						<span data-token={token.type}>{token.value}</span>
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
		padding-inline: 0.5em;
		border-right: 1px solid #888;
		color: #ccc;
		overflow-wrap: normal;
	}

	.line-content {
		display: inline-block;
		white-space: pre-wrap;
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
