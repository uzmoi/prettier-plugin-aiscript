<script lang="ts">
    import { format } from "prettier";
    import { AiScriptSyntaxError } from "@syuilo/aiscript/error.js";
    import plugin from "../../src";
    import HighlightTextarea from "./lib/HighlightTextarea.svelte";

    let value = "";

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
                    <p>{error.message}</p>
                {:else}
                    <p>Unknown error.</p>
                {/if}
            </div>
        {/await}
    </div>
</div>

<style>
    .playground {
        flex: 1 1 auto;

        display: flex;
        flex-flow: row wrap;
        gap: 1em;
    }

    .panel {
        flex: 1 1 32em;
        overflow-y: auto;
        min-width: 0;
        min-height: 0;
        border: 1px solid #aaa;
    }

    .error {
        padding: 0.6em;
        font-family: monospace;
        background-color: #a22;
    }
</style>
