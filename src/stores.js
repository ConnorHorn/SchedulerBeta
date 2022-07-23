import {writable} from "svelte/store";

export const festival = getFestival();
export const leftFly = writable(0);
export const rightFly = writable(0);
export const dataMap = new Map();
function getFestival() {

    const { subscribe, set, update } = writable("North Coast");

    return {
        subscribe,
        northCoast: () => update(n => "North Coast"),
        electricZoo: () => update(n => "Electric Zoo")
    }
}


