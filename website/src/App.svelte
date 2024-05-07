<script lang="ts">
    import { AISCRIPT_VERSION } from "@syuilo/aiscript/constants.js";
    import Playground from "./Playground.svelte";
</script>

<main>
    <h1>prettier-plugin-aiscript playground</h1>
    <p>AiScript Version: {AISCRIPT_VERSION}</p>
    <Playground />
</main>

<style>
    :global(*, ::before, ::after) {
        box-sizing: border-box;
        margin: 0;
    }

    :global(img, svg) {
        vertical-align: middle;
    }

    :global(:root) {
        font-family: system-ui;
        background-color: #242424;
        color: #eee;
    }

    :global(:root, body, #app, main) {
        height: 100%;
    }

    main {
        display: flex;
        flex-flow: column nowrap;
        padding: 1em 2em;
    }

    h1 {
        font-size: xx-large;
        line-height: 1.2;
    }
</style>
