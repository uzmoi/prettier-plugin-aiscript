<script lang="ts">
	import { AISCRIPT_VERSION } from "@syuilo/aiscript/constants.js";
	import type { Options } from "prettier";
	import Playground from "./Playground.svelte";
	import initialCode from "./assets/playground-initial-code.ais?raw";

	const links: [string, string][] = [
		["NPM", "https://www.npmjs.com/package/@uzmoi/prettier-plugin-aiscript"],
		["GitHub", "https://github.com/uzmoi/prettier-plugin-aiscript"],
	];

	let printWidth = 80;
	let tabWidth = 2;
	let useTabs = false;
	let singleQuote = false;

	$: options = {
		printWidth: printWidth && Math.floor(printWidth),
		tabWidth,
		useTabs,
		singleQuote,
	} satisfies Options;
</script>

<div id="root">
	<header>
		<div>
			<h1>prettier-plugin-aiscript playground</h1>
			<p>AiScript {AISCRIPT_VERSION}</p>
		</div>
		<section>
			<h2>Options</h2>
			<label>
				printWidth <input type="number" bind:value={printWidth} />
			</label>
			<label>
				tabWidth <select bind:value={tabWidth}>
					<option value={2}>2</option>
					<option value={4}>4</option>
					<option value={8}>8</option>
				</select>
			</label>
			<label>
				useTabs <input type="checkbox" bind:checked={useTabs} />
			</label>
			<label>
				singleQuote <input type="checkbox" bind:checked={singleQuote} />
			</label>
		</section>
		<ul>
			{#each links as [name, href]}
				<li>
					<a {href} rel="noreferrer">{name}</a>
				</li>
			{/each}
		</ul>
	</header>
	<main>
		<Playground value={initialCode} {options} />
	</main>
</div>

<style>
	#root {
		display: flex;
		flex-flow: column nowrap;
		height: 100%;
		color-scheme: dark;
	}

	header {
		flex: 0 0 auto;

		display: flex;
		flex-flow: row wrap;
		gap: 0.5em 2em;
		justify-content: space-between;
		align-items: center;
		padding: 0.25em 2em;
		background-color: #333;
	}

	h1 {
		font-size: x-large;
		line-height: 1.2;
	}

	h2 {
		font-size: small;
		line-height: 1.2;
	}

	label + label::before {
		content: "/";
		display: inline-block;
		margin-inline: 0.5em;
	}

	input[type="number"] {
		width: 4em;
	}

	input[type="checkbox"] {
		vertical-align: middle;
	}

	ul {
		list-style: none;
		padding: 0;
		display: inline-flex;
		gap: 0.75em;
	}

	a {
		color: currentColor;
		font-size: large;
		transition: color 0.25s;
	}

	a:hover {
		color: #1e9;
	}

	main {
		flex: 1 1 0;
		padding: 0.75em 1em;
		min-height: 0;
		container-type: inline-size;
	}
</style>
