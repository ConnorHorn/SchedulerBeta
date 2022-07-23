<script>
    import { fade, fly } from 'svelte/transition';
import Card from "./Card.svelte";
    import * as data from './data.json';
    import {rightFly, leftFly, festival, dataMap} from "./stores";

let artist
let artist2
let cardFlicker = true;
let leftOut = -800;
let rightOut = 800;
let scheduleArray;
let dataArray = JSON.parse(JSON.stringify(data));
$: {
    updateCards(artist, artist2);
    updateFestival($festival)
}

function updateCards(){
    cardFlicker = false;
    setTimeout(function() {
        cardFlicker = true;
    }, 600);

}

function compareBetterThan(a, b) {
    if (dataArray["Artists"][a]["BetterThan"]>dataArray["Artists"][b]["BetterThan"]) {
        return -1;
    }
    if (dataArray["Artists"][a]["BetterThan"]<dataArray["Artists"][b]["BetterThan"]) {
        return 1;
    }
    return 0;
}
    scheduleArray = dataArray["Festivals"][$festival.replace(/\s/g, '')]["Schedule"];
    artist=scheduleArray[0][1];
    artist2=scheduleArray[0][2];
function updateFestival() {
    if(scheduleArray !== dataArray["Festivals"][$festival.replace(/\s/g, '')]["Schedule"]) {
        scheduleArray = dataArray["Festivals"][$festival.replace(/\s/g, '')]["Schedule"];
        artist=scheduleArray[0][1];
        artist2=scheduleArray[0][2];
    }
}

let test="poop"







function handleResult(event) {

    if(event.detail.text === "left"){
        dataArray["Artists"][artist]["BetterThan"] = dataArray["Artists"][artist]["BetterThan"].concat(artist2, dataArray["Artists"][artist2]["BetterThan"]);
        if(artist<artist2){
            dataMap.set(artist+"---"+artist2, 1);
        }
        else{
            dataMap.set(artist2+"---"+artist, 2);
        }
        console.log(dataMap);
    }
    if(event.detail.text === "right"){
        dataArray["Artists"][artist2]["BetterThan"] = dataArray["Artists"][artist2]["BetterThan"].concat(artist, dataArray["Artists"][artist]["BetterThan"] );
        if(artist<artist2){
            dataMap.set(artist+"---"+artist2, 2);
        }
        else{
            dataMap.set(artist2+"---"+artist, 1);
        }
    }


    for(let i=0; i<scheduleArray.length; i++){
        let rowDone = false;
        console.log("lol2",dataArray["Artists"]["Illenium"]["BetterThan"]);

        for (let j = 1; j < scheduleArray[i].length; j++) {
            console.log(scheduleArray[i][j]);
            let compare1 = dataArray["Artists"][scheduleArray[i][j]]["BetterThan"].concat(scheduleArray[i][j], scheduleArray[i][0]);
            let containsAll = scheduleArray[i].every(element => {
                return compare1.includes(element);
            });
            for(let y=0; y<3; y++) {
                for (let a = 0; dataArray["Artists"][scheduleArray[i][j]]["BetterThan"].length > a; a++) {
                    dataArray["Artists"][scheduleArray[i][j]]["BetterThan"] = dataArray["Artists"][scheduleArray[i][j]]["BetterThan"].concat(dataArray["Artists"][dataArray["Artists"][scheduleArray[i][j]]["BetterThan"][a]]["BetterThan"])
                    dataArray["Artists"][scheduleArray[i][j]]["BetterThan"] = [...new Set(dataArray["Artists"][scheduleArray[i][j]]["BetterThan"])];

                }
            }
            if(containsAll){
                rowDone = true;
                console.log("lol");
                console.log("compare1: " + compare1);
                break;
            }
        }

        if(!rowDone) {
            if(scheduleArray[i].length>5) {
                console.log("HUUUH");
                for (let j = scheduleArray[i].length - 1; j > 1; j = j - 4) {
                    let k = j - 3;
                    let check1 = scheduleArray[i][j];
                    let check2 = scheduleArray[i][k];
                    console.log(check1, check2);
                    if (!(dataArray["Artists"][check1]["BetterThan"].includes(check2) || dataArray["Artists"][check2]["BetterThan"].includes(check1))) {
                        artist = check1;
                        artist2 = check2;
                        console.log(artist, artist2);
                        return;
                    }
                }
            }

            for (let j = scheduleArray[i].length - 1; j > 1; j = j - 2) {
                let k = j - 1;
                let check1 = scheduleArray[i][j];
                let check2 = scheduleArray[i][k];
                console.log(check1, check2);
                console.log("12",check1, check2);
                if (!(dataArray["Artists"][check1]["BetterThan"].includes(check2) || dataArray["Artists"][check2]["BetterThan"].includes(check1))) {
                    artist = check1;
                    artist2 = check2;
                    console.log(artist, artist2);
                    return;
                }
            }


            let comparisonArray = JSON.parse(JSON.stringify(scheduleArray[i]));
            comparisonArray.shift();
             comparisonArray.sort(compareBetterThan);
            console.log("comparisonArray: " + comparisonArray);
            for(let y=0; y<comparisonArray.length-1; y++){
                for(let z=y+1; z<comparisonArray.length; z++){
                    console.log("yz",comparisonArray[y], comparisonArray[z]);
                    if (!(dataArray["Artists"][comparisonArray[y]]["BetterThan"].includes(comparisonArray[z]) || dataArray["Artists"][comparisonArray[z]]["BetterThan"].includes(comparisonArray[y]))) {
                        artist = comparisonArray[y];
                        artist2 = comparisonArray[z];
                        console.log(artist, artist2);
                        return;
                    }
                }
            }









            console.log("continued to 1s");


            for (let j = 1; j < scheduleArray[i].length; j++) {
                for (let k = scheduleArray[i].length - 1; k > j; k--) {
                    let check1 = scheduleArray[i][j];
                    let check2 = scheduleArray[i][k];
                    console.log(check1, check2);
                    if (!(dataArray["Artists"][check1]["BetterThan"].includes(check2) || dataArray["Artists"][check2]["BetterThan"].includes(check1))) {
                        artist = check1;
                        artist2 = check2;
                        console.log(artist, artist2);
                        return;
                    }
                }
            }
        }
    }
    console.log("reached end somehow")
}

</script>
{#if cardFlicker}
<div class="grid grid-cols-2 grid-rows-1 gap-20 w-full h-full fixed items-center -mt-12" >
    <div class="box w-2/3 h-3/4 justify-self-end" out:fly="{{ y: $leftFly, duration: 500 }}" in:fly="{{ x: -800, duration: 700 }}">
        <Card on:message={handleResult} {artist} vote = {"left"} />
    </div>
    <div class="box w-2/3 h-3/4 justify-self-start" out:fly="{{ y: $rightFly, duration: 500 }}"  in:fly="{{ x: 800, duration: 700 }}">
        <Card on:message={handleResult} artist={artist2} vote = {"right"} />
    </div>
</div>
    {/if}



