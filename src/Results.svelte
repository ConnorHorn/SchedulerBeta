<script>
    import {schedule, scheduleTimes, page, festival} from "./stores";
    import * as data from "./data.json";

    let numberOfDays = 1;
    const daysMap = new Map();
    let maxDayLength = 1;
    let maxDay = 1;
    let offsetMap = new Map();
    let startMap = new Map();

    export let dataArray = JSON.parse(JSON.stringify(data));

    for (let u = 1; u < 11; u++) {
        for (let w = 0; w < $scheduleTimes.length; w++) {
            if ($scheduleTimes[w].includes("[" + u + "]")) {
                numberOfDays = u;
                if (daysMap.get(u) !== null) {
                    daysMap.set(u, daysMap.get(u) + 1);
                } else {
                    daysMap.set(u, 1);
                }
                if (daysMap.get(u) > maxDayLength) {
                    maxDayLength = daysMap.get(u);
                    maxDay = u;
                }
            }
        }
        if (daysMap.get(u) !== null) {
        }
    }

    for (let u = 1; u <= numberOfDays; u++) {
        let first = true;
        let count = 0;
        for (let i = 0; i < $scheduleTimes.length; i++) {
            if ($scheduleTimes[i].includes("[" + u + "]")) {
                count++;
                if($scheduleTimes[i].replace("[" + u + "]","")===dataArray["Festivals"][$festival.replace(/\s/g, '')]["StartTime"]){
                    offsetMap.set(u,count)
                }
                if(first){
                    startMap.set(u,i);
                    first=false;
                }
            }

        }

    }

</script>

{numberOfDays}
{offsetMap.get(1)}
<div class="grid overflow-hidden grid-cols-{numberOfDays} grid-rows-{maxDayLength} gap-2 w-full h-full">
    {#each Array(numberOfDays) as _, a}
    {#each Array(offsetMap.get(a)) as _, b}
        <div class="box">-</div>
    {/each}
    {#each Array(daysMap.get(a)) as _, c}
        <div class="box">{$schedule[c+startMap[a]]}{$schedule[c+startMap[a]]}</div>
    {/each}
    {/each}

</div>