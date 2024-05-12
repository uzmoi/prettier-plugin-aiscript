<script lang="ts">
    import { AISCRIPT_VERSION } from "@syuilo/aiscript/constants.js";
    import Playground from "./Playground.svelte";
    import initialCode from "./assets/initial-code.is?raw";
</script>

<main>
    <h1>prettier-plugin-aiscript playground</h1>
    <p>AiScript Version: {AISCRIPT_VERSION}</p>
    <div class="playground">
        <Playground value={initialCode} />
    </div>
</main>

<style>
    main {
        display: flex;
        flex-flow: column nowrap;
        padding: 1em 2em;
        height: 100%;
    }

    h1 {
        font-size: xx-large;
        line-height: 1.2;
    }

    .playground {
        flex: 1 1 0;
        min-height: 0;
    }
</style>
