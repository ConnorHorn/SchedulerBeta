<script>
    import * as data from './artists.json';
    export let artist = "";
    export let vote = "";
    let evalBase = "data.Artists."+artist+".";
    let genres = ["temp1","temp2","temp3"];
</script>

<div class="card bg-base-300 shadow-xl h-fixed w-fixed h-full w-full z-10">
    <figure class="px-10 pt-10 h-1/2">
        <img src={eval(evalBase+"ImageURL")} alt="Artist Logo" class="rounded-xl" />
    </figure>
    <div class="card-body items-center text-center space-y-3">
        <h2 class="card-title text-6xl">{eval(evalBase+"Name")}</h2>
        <div class="space-x-1">
            {#each genres as genre}
            <div class="badge badge-accent">{genre}</div>
                {/each}
        </div>
        <div class="card-actions">
            <button class="btn btn-primary">Buy Now</button>
        </div>
    </div>
</div>



<!--{eval(evalBase+artist+'.'+"ImageURL")}-->




