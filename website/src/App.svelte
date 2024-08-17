<script lang="ts">
	import { AISCRIPT_VERSION } from "@syuilo/aiscript/constants.js";
	import Playground from "./Playground.svelte";
	import initialCode from "./assets/playground-initial-code.ais?raw";

	const links: [string, string][] = [
		["NPM", "https://www.npmjs.com/package/@uzmoi/prettier-plugin-aiscript"],
		["GitHub", "https://github.com/uzmoi/prettier-plugin-aiscript"],
	];
</script>

<div id="root">
	<header>
		<div>
			<h1>prettier-plugin-aiscript playground</h1>
			<p>AiScript {AISCRIPT_VERSION}</p>
		</div>
		<ul>
			{#each links as [name, href]}
				<li>
					<a {href} rel="noreferrer">{name}</a>
				</li>
			{/each}
		</ul>
	</header>
	<main>
		<Playground value={initialCode} />
	</main>
</div>

<style>
	#root {
		display: flex;
		flex-flow: column nowrap;
		height: 100%;
	}

	header {
		flex: 0 0 auto;

		display: flex;
		flex-flow: row wrap;
		justify-content: space-between;
		align-items: center;
		padding: 0.25em 2em;
		background-color: #333;
	}

	h1 {
		font-size: x-large;
		line-height: 1.2;
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
