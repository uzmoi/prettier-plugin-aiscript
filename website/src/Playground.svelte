<script lang="ts">
	import { wrap } from "comlink";
	import type { Options } from "prettier";
	import { asyncDebounce } from "./lib/async-debounce";
	import HighlightTextarea from "./lib/HighlightTextarea.svelte";
	import type { exports, FormatError } from "./worker";
	import Worker from "./worker?worker";

	export let value = "";
	export let options: Options = {};

	const worker = wrap<typeof exports>(new Worker());

	let formatted: string | undefined;
	let error: FormatError | undefined;

	const format = asyncDebounce(async (value: string, options: Options) => {
		[formatted, error] = await worker.format(value, options);
	}, 250);

	$: format(value, options);
</script>

<div class="playground" style:tab-size={options.tabWidth ?? 2}>
	<div class="panel">
		<HighlightTextarea
			bind:value
			errorPos={error?.name === "Syntax" ? error.pos : null}
		/>
	</div>
	<div class="panel">
		{#if error != null}
			<div class="error">
				{#if error.name === "Syntax"}
					<p>[Syntax Error] {error.message}</p>
				{:else if error.name === "Format"}
					<p>[Format Error]</p>
					<pre>{error.message}</pre>
				{/if}
			</div>
		{/if}
		{#if formatted != null}
			<HighlightTextarea value={formatted} readonly />
		{/if}
	</div>
</div>

<style>
	.playground {
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 1em;
	}
	@container (min-width: 64em) {
		.playground {
			flex-direction: row;
		}
	}

	.panel {
		flex: 1 1 0;
		overflow-y: auto;
		min-width: 16em;
		min-height: 0;
		max-height: 100%;
	}

	.error {
		padding: 0.6em;
		font-family: "Inconsolata", monospace;
		font-size: 14px;
		background-color: #a22;
	}

	.error pre {
		white-space: pre-wrap;
		line-break: anywhere;
	}
</style>
