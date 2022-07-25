<script>
    import NavBar from "./NavBar.svelte";
    import Eval from "./Eval.svelte";
    import {page} from "./stores";
    import Results from "./Results.svelte";
</script>



<div class="z-30 relative">
    <NavBar/>
</div>
{#if $page==="eval"}
<div class="z-20 relative">
    <Eval/>
</div>
{/if}
{#if $page==="results"}
    <div class="z-20 relative">
        <Results/>
    </div>
{/if}

