<script lang="ts">
	import { AiScriptSyntaxError } from "@syuilo/aiscript/error.js";
	import { format } from "prettier";
	import plugin from "../../src";
	import HighlightTextarea from "./lib/HighlightTextarea.svelte";

	export let value = "";

	$: formatting = format(value, {
		parser: "aiscript",
		plugins: [plugin],
	});
</script>

<div class="playground">
	<div class="panel">
		<HighlightTextarea bind:value />
	</div>
	<div class="panel">
		{#await formatting}
			wait...
		{:then formatted}
			<HighlightTextarea value={formatted} readonly />
		{:catch error}
			<div class="error">
				{#if error instanceof AiScriptSyntaxError}
					<p>{error.message}</p>
				{:else if error instanceof Error}
					<p>Format error.</p>
					<pre>{error.stack || error.message}</pre>
				{:else}
					<p>Unknown error.</p>
				{/if}
			</div>
		{/await}
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
		font-family: monospace;
		background-color: #a22;
	}

	.error pre {
		white-space: pre-wrap;
		line-break: anywhere;
	}
</style>
