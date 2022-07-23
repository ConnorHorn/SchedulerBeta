<script>
    import * as data from './data.json';
    import {createEventDispatcher} from 'svelte';
    import {leftFly, rightFly} from "./stores";
    export let artist = "";
    export let vote = "";
    let dataArray = JSON.parse(JSON.stringify(data));
    let genres = dataArray["Artists"][artist]["Genres"];
    const dispatch = createEventDispatcher();
    function Clicked() {
        if(vote === "left"){
            leftFly.update(n=>-800);
            rightFly.update(n=>800);
            dispatch('message',{
                text: "left"
            });
        }
        else if(vote === "right"){
            leftFly.update(n=>800);
            rightFly.update(n=>-800);
            dispatch('message',{
                text: "right"
            });
        }
    }
</script>

<div class="card bg-base-300 shadow-xl h-fixed w-fixed h-full w-full z-10">
    <div class="grid overflow-hidden grid-cols-1 grid-rows-4 gap-2 w-full h-full">
        <div class="box row-start-1 row-span-2 col-start-1 col-span-1">
            <figure class="px-10 pt-2">
                <img src={dataArray["Artists"][artist]["ImageURL"]} alt="Artist Logo" class="rounded-full h-96 aspect-auto object-contain"  />
            </figure>
        </div>
        <div class="box row-start-3 row-span-1 col-start-1 col-span-1 card-body items-center text-center space-y-3 relative">
            <h2 class="card-title text-6xl">{dataArray["Artists"][artist]["Name"]}</h2>
            <div class="space-x-1">
                {#each genres as genre}
                    <div class="badge badge-accent">{genre}</div>
                {/each}
            </div>
        </div>
        <div class="box row-start-4 row-span-1 col-start-1 col-span-1 card-body items-center text-center -mt-9 relative object-scale-down ">
            <button on:click ={Clicked} class="btn btn-primary btn-square w-72 h-36 relative ">

                <svg xmlns="http://www.w3.org/2000/svg" class="h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>

            </button>
        </div>
    </div>
</div>









