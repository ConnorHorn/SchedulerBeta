<script>
    import {festival} from "./stores";


</script>


<div class="navbar bg-primary font-bold">
    <div class="flex-1">
        <a class="btn btn-ghost normal-case font-bold text-3xl">festivalPlanner</a>

        <ul class="menu menu-horizontal p-0 ">
            <li tabindex="0">
                <a>
                    {$festival}
                    <svg class="fill-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/></svg>
                </a>
                <ul class="p-2 bg-base-300">
                    <li on:click = {festival.northCoast} ><a>North Coast</a></li>
                    <li on:click = {festival.electricZoo} ><a>Electric Zoo</a></li>
                </ul>
            </li>
        </ul>
    </div>
</div>