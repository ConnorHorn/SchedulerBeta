import {writable} from "svelte/store";

export const festival = getFestival();

function getFestival() {

    const { subscribe, set, update } = writable("North Coast");

    return {
        subscribe,
        northCoast: () => update(n => "North Coast"),
        electricZoo: () => update(n => "Electric Zoo")
    }
}

