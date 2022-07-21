<script>

import Card from "./Card.svelte";

let artist = "Illenium"
let cardFlicker = true;
function temp(){
    artist = "Galantis"
}
$: {
    updateCards(artist)
}

function updateCards(){
    cardFlicker = false;
    setTimeout(function() {
        cardFlicker = true;
    }, 1);

}

</script>


{cardFlicker}
<button on:click = {temp} class="btn z-30 fixed">Button</button>
{#if cardFlicker}
<div class="grid grid-cols-2 grid-rows-1 gap-20 w-full h-full fixed items-center -mt-12">
    <div class="box w-2/3 h-3/4 justify-self-end">
        <Card {artist} vote = {"left"} />
    </div>
    <div class="box w-2/3 h-3/4 justify-self-start">
        <Card {artist} vote = {"right"} />
    </div>
</div>
    {/if}





