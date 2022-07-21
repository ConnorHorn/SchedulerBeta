<script>
    import * as data from './artists.json';
    export let artist = "";
    export let vote = "";
    let evalBase = "data.Artists."+artist+".";
    let genres = ["temp1","temp2","temp3"];
    let prompts = ["Cooler"]
</script>

<div class="card bg-base-300 shadow-xl h-fixed w-fixed h-full w-full z-10">
    <figure class="px-10 pt-10 h-1/2">
        <img src={eval(evalBase+"ImageURL")} alt="Artist Logo" class="rounded-xl" />
    </figure>
    <div class="card-body items-center text-center space-y-3 ">
        <h2 class="card-title text-6xl">{eval(evalBase+"Name")}</h2>
        <div class="space-x-1">
            {#each genres as genre}
            <div class="badge badge-accent">{genre}</div>
                {/each}
        </div>
        <div class="card-actions pt-12">
            <button class="btn btn-primary btn-square w-72 h-36 relative">

                <svg xmlns="http://www.w3.org/2000/svg" class="h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>

            </button>
        </div>
    </div>
</div>



<!--{eval(evalBase+artist+'.'+"ImageURL")}-->




