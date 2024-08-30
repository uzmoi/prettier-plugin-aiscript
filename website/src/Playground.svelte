<script lang="ts">
	import { wrap } from "comlink";
	import type { Options } from "prettier";
	import HighlightTextarea from "./lib/HighlightTextarea.svelte";
	import { asyncDebounce } from "./lib/async-debounce";
	import type { exports } from "./worker";
	import Worker from "./worker?worker";

	export let value = "";
	export let options: Options = {};

	const worker = wrap<typeof exports>(new Worker());

	let formatted: string | null = null;
	let error: unknown;

	const format = asyncDebounce(async (value: string, options: Options) => {
		try {
			[formatted, error] = await worker.format(value, options);
		} catch (e) {
			formatted = null;
			error = e;
		}
	}, 250);

	$: format(value, options);
</script>

<div class="playground" style:tab-size={options.tabWidth ?? 2}>
	<div class="panel">
		<HighlightTextarea bind:value />
	</div>
	<div class="panel">
		{#if error != null}
			<div class="error">
				{#if error instanceof Error}
					{#if error.name === "Syntax"}
						<p>{error.message}</p>
					{:else}
						<p>Format error.</p>
						<pre>{error.stack || error.message}</pre>
					{/if}
				{:else}
					<p>Unknown error.</p>
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
