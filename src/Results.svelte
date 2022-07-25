<script>
    import {schedule, scheduleTimes, page} from "./stores";

    let numberOfDays=1;
    const daysMap = new Map();
    let maxDayLength = 1;
    let maxDay = 1;
    let offsetMap = new Map();

    for(let u=1; u<11; u++) {
        for (let w = 0; w < $scheduleTimes.length; w++) {
            if ($scheduleTimes[w].includes("[" + u + "]")) {
                numberOfDays = u;
                if(daysMap.get(u)!==null){
                    daysMap.set(u,daysMap.get(u)+1);
                }
                else{
                    daysMap.set(u,1);
                }
                if(daysMap.get(u)>maxDayLength){
                    maxDayLength=daysMap.get(u);
                    maxDay=u;
                }
            }
        }
        if(daysMap.get(u)!==null){
        }
    }

</script>

<div class="grid overflow-hidden grid-cols-{numberOfDays} grid-rows-{$scheduleTimes.length} gap-2 w-full h-full">
    {#each Array($scheduleTimes.length) as _, i}
    <div class="box">{$scheduleTimes[i]}{$schedule[i]}</div>
    {/each}
</div>