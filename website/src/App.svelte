<script lang="ts">
	import { AISCRIPT_VERSION } from "@syuilo/aiscript/constants.js";
	import Playground from "./Playground.svelte";
	import initialCode from "./assets/playground-initial-code.ais?raw";
</script>

<div id="root">
	<header>
		<div>
			<h1>prettier-plugin-aiscript playground</h1>
			<p>AiScript {AISCRIPT_VERSION}</p>
		</div>
		<a
			href="https://github.com/uzmoi/prettier-plugin-aiscript"
			rel="noreferrer"
		>
			GitHub
		</a>
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
		padding: 1em 2em;
		min-height: 0;
		container-type: inline-size;
	}
</style>
