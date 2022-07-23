
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const festival = getFestival();
    const leftFly = writable(0);
    const rightFly = writable(0);
    const dataMap = new Map();
    function getFestival() {

        const { subscribe, set, update } = writable("North Coast");

        return {
            subscribe,
            northCoast: () => update(n => "North Coast"),
            electricZoo: () => update(n => "Electric Zoo")
        }
    }

    /* src\NavBar.svelte generated by Svelte v3.49.0 */
    const file$3 = "src\\NavBar.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let a0;
    	let t1;
    	let ul1;
    	let li2;
    	let a1;
    	let t2;
    	let t3;
    	let svg;
    	let path;
    	let t4;
    	let ul0;
    	let li0;
    	let a2;
    	let t6;
    	let li1;
    	let a3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "festivalPlanner";
    			t1 = space();
    			ul1 = element("ul");
    			li2 = element("li");
    			a1 = element("a");
    			t2 = text(/*$festival*/ ctx[0]);
    			t3 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t4 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a2 = element("a");
    			a2.textContent = "North Coast";
    			t6 = space();
    			li1 = element("li");
    			a3 = element("a");
    			a3.textContent = "Electric Zoo";
    			attr_dev(a0, "class", "btn btn-ghost normal-case font-bold text-3xl");
    			add_location(a0, file$3, 9, 8, 151);
    			attr_dev(path, "d", "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z");
    			add_location(path, file$3, 15, 124, 487);
    			attr_dev(svg, "class", "fill-current");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "20");
    			attr_dev(svg, "height", "20");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$3, 15, 20, 383);
    			add_location(a1, file$3, 13, 16, 325);
    			add_location(a2, file$3, 18, 58, 689);
    			add_location(li0, file$3, 18, 20, 651);
    			add_location(a3, file$3, 19, 59, 773);
    			add_location(li1, file$3, 19, 20, 734);
    			attr_dev(ul0, "class", "p-2 bg-accent");
    			add_location(ul0, file$3, 17, 16, 603);
    			attr_dev(li2, "tabindex", "0");
    			add_location(li2, file$3, 12, 12, 290);
    			attr_dev(ul1, "class", "menu menu-horizontal p-0 ");
    			add_location(ul1, file$3, 11, 8, 238);
    			attr_dev(div0, "class", "flex-1");
    			add_location(div0, file$3, 8, 4, 121);
    			attr_dev(div1, "class", "navbar bg-primary font-bold z-40");
    			add_location(div1, file$3, 7, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t1);
    			append_dev(div0, ul1);
    			append_dev(ul1, li2);
    			append_dev(li2, a1);
    			append_dev(a1, t2);
    			append_dev(a1, t3);
    			append_dev(a1, svg);
    			append_dev(svg, path);
    			append_dev(li2, t4);
    			append_dev(li2, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a2);
    			append_dev(ul0, t6);
    			append_dev(ul0, li1);
    			append_dev(li1, a3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(li0, "click", festival.northCoast, false, false, false),
    					listen_dev(li1, "click", festival.electricZoo, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$festival*/ 1) set_data_dev(t2, /*$festival*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $festival;
    	validate_store(festival, 'festival');
    	component_subscribe($$self, festival, $$value => $$invalidate(0, $festival = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavBar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ festival, $festival });
    	return [$festival];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    var Artists={Illenium:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb6b5fbf615ada187ce5e425c8",Name:"Illenium",Genres:["Melodic Dubstep","Sad Boy","Pop","Pop Dance"],BetterThan:[]},Galantis:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb2ca90cb37bf1557d385b9d48",Name:"Galantis",Genres:["Dance Pop","EDM","Electro House","Pop"],BetterThan:[]},TwoFriends:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb2ebfa3de9d4f27eaa0dde614",Name:"Two Friends",Genres:["Big Booties","EDM","Pop Dance","Tropical House"],BetterThan:[]},PorterRobinson:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb6ccb967cecc6f1da90fe355e",Name:"Porter Robinson",Genres:["Complextro","EDM","Future Bass","Melodic Dubstep"],BetterThan:[]},Diplo:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebee376ee0e88042b34dee6e62",Name:"Diplo",Genres:["EDM","Electro House","Moombahton","Ninja"],BetterThan:[]},SaidTheSky:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebcd9e2b8f901285164a7fde6c",Name:"Said The Sky",Genres:["EDM","Electro Pop","Future Bass","Melodic Dubstep"],BetterThan:[]},Gryffin:{ImageURL:"https://apeconcerts.com/wp-content/uploads/2018/10/gryffin_18_1024-1024x576.jpg",Name:"Gryffin",Genres:["Dance Pop","EDM","Pop","Pop Dance"],BetterThan:[]},Mime:{ImageURL:"https://i.scdn.co/image/3294d45132b491b193fb3e7423d1c81af217cd08",Name:"Mime",Genres:["Slap House"],BetterThan:[]},BrunoMartini:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb826de4d67a791e8f5e058139",Name:"Bruno Martini",Genres:["EDM","Brazilian EDM","Pop Nacional"],BetterThan:[]},SamFeldt:{ImageURL:"https://yt3.ggpht.com/ytc/AKedOLS-_viGnqoTz84l9y9Zrp4juHqwIHeDix0UGlop2Q=s900-c-k-c0x00ffffff-no-rj",Name:"Sam Feldt",Genres:["Dance Pop","EDM","Electro House","Pop Dance"],BetterThan:[]},Joyryde:{ImageURL:"https://i1.sndcdn.com/avatars-000145463923-qyfu09-t500x500.jpg",Name:"JOYRYDE",Genres:["Bass House","EDM","Electro House","Electronic Trap"],BetterThan:[]},LoudLuxury:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eba4686c91d1b14b400725f95e",Name:"Loud Luxury",Genres:["Dance Pop","EDM","Electro House","Pop"],BetterThan:[]},Fisher:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb26b6458775a693999d024473",Name:"FISHER",Genres:["Australian House"],BetterThan:[]},SevenLions:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb3a120b5c7fefeed869234a71",Name:"Seven Lions",Genres:["Dubstep","EDM","Electro House","Future Bass"],BetterThan:[]},Alesso:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb1605eca2d6cc32b05a2d56b1",Name:"Alesso",Genres:["Dance Pop","EDM","Electro House","Pop"],BetterThan:[]},Harber:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb59e4071d1ecb0459b74c2b1a",Name:"HARBER",Genres:["Belgian EDM","Dutch House"],BetterThan:[]},KillScript:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebf213fe23046692d2a725af33",Name:"KILL SCRIPT",Genres:["Electro House","Dark Clubbing","Vapor Twitch","Experimental Bass"],BetterThan:[]},DrFresch:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb5eb95846d69c3a6858ce3839",Name:"Dr. Fresch",Genres:["Bass House","EDM","Electro House","Electronic Trap"],BetterThan:[]},Audien:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb275d687af88bb66830756ff6",Name:"Audien",Genres:["EDM","Electro House","Pop Dance","Pop EDM"],BetterThan:[]},Zomboy:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb82bf025983a4856645a866b4",Name:"Zomboy",Genres:["Brostep","Dubstep","EDM","Electro House"],BetterThan:[]},SteveAoki:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb7c4240b7951da248f3404e42",Name:"Steve Aoki",Genres:["Dance Pop","EDM","Electro House"],BetterThan:[]},Tiesto:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb8cb651b2e77c6d30b1de15e4",Name:"Tiesto",Genres:["Big Room","Brostep","Dance Pop","Dutch EDM"],BetterThan:[]},Rezz:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebd32795654cee9204e8bdcfde",Name:"Rezz",Genres:["Canadian Electronic","EDM","Electra","Electro House"],BetterThan:[]},Kaskade:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebc96f32c30b4c236b5b9c40fa",Name:"Kaskade",Genres:["EDM","Electronic House","House","Pop Dance"],BetterThan:[]},NightTales:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb982bdd0408ef501f4bdeaefc",Name:"Night Tales",Genres:["Australian Dance"],BetterThan:[]},OverEasy:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb14aba73aed46ed4e0794eff7",Name:"Over Easy",Genres:["Pop EDM","Melodic Dubstep","Pop Dance","Progressive Electro House"],BetterThan:[]},Jvna:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebf5b12b45d7b36943ccfbc68e",Name:"JVNA",Genres:["Electra","Future Bass","Melodic Dubstep","Pop EDM"],BetterThan:[]},AndrewRayel:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb13bdeaa329767db2d03db7fb",Name:"Andrew Rayel",Genres:["EDM","Moldovan Pop","Pop Dance","Progressive House"],BetterThan:[]},AdventureClub:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb40baef401cb7f5c6511771bc",Name:"Adventure Club",Genres:["Brostep","Canadian Electronic","EDM","Electro House"],BetterThan:[]},AlanWalker:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb29da45fd16f4b249be105618",Name:"Alan Walker",Genres:["Alan Walker","That Roblox Song"],BetterThan:[]},Kshmr:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebd1db941d6e307ab229651fae",Name:"KSHMR",Genres:["Big Room","EDM","Electro House","Indian EDM"],BetterThan:[]},Heyz:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebdf1461245bb0050c0a5063f5",Name:"Heyz",Genres:["Expermental Bass","Dubstep","Gaming Dubstep","Electro House"],BetterThan:[]},Sippy:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb2619a05ec4de2457a244dd52",Name:"SIPPY",Genres:["Dubstep","Gaming Dubstep","Electro House","Brostep"],BetterThan:[]},Lick:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb87b0e3c885f5948e583ea628",Name:"LICK",Genres:["Dark Clubbing","Experimental Bass"],BetterThan:[]},Blanke:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb73d2a8b4517d99178d76f75d",Name:"Blanke",Genres:["Dubstep","EDM","Electro House","Future Bass"],BetterThan:[]},Yultron:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb1a7603173156cf8df344d3bf",Name:"YULTRON",Genres:["K-Rap","Korean R&B","Electro House","Electronic Trap"],BetterThan:[]},BluntsAndBlondes:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebe445a4aa2ce626954bbf0427",Name:"Blunts & Blondes",Genres:["Dubstep","Electronic Trap"],BetterThan:[]},Peekaboo:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb2da9e139d2a797ed241994ae",Name:"PEEKABOO",Genres:["Brostep","Dubstep","EDM","Electro House"],BetterThan:[]},Subtronics:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebda3630f6732d14437a4ab33d",Name:"Subtronics",Genres:["Dubstep","EDM","Electro House","Electronic Trap"],BetterThan:[]},ZedsDead:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb8f9c9739f2bbee96365a4b23",Name:"Zeds Dead",Genres:["Brostep","Canadian Electronic","Dubstep","EDM"],BetterThan:[]},Anakim:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebb56ddd3cdc2d215bd2e01645",Name:"Anakim",Genres:["Melodic Techno","Focus Trance","Deep Euro House","Psytech"],BetterThan:[]},SitaAbellan:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eba6c9160a8c6443e20daf3ff7",Name:"Sita Abellan",Genres:[],BetterThan:[]},Rinzen:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb4bbdb94b3146ac6e446e4fda",Name:"Rinzen",Genres:["Progressive House","Electro House","EDM","Progressive Trance House"],BetterThan:[]},TownshipRebellion:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebbaae3016c7a67c9d1b5c1b39",Name:"Township Rebellion",Genres:["Tech House"],BetterThan:[]},Artbat:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebc1347b34c318f8af8d73bcbb",Name:"ARTBAT",Genres:["Ukranan Electronic"],BetterThan:[]},Testpilot:{ImageURL:"https://media.resources.festicket.com/www/artists/Testpilot.jpg",Name:"Testpilot",Genres:["Electro House","EDM","Deep Psytrance","Canadian Electronic"],BetterThan:[]},AceAura:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb366fd3f6f3cbde87885a9128",Name:"Ace Aura",Genres:["Dubstep","Electro House","Gaming Dubstep","Melodic Dubstep"],BetterThan:[]},Swarm:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebf1995aa88acba845510ddcce",Name:"SWARM",Genres:["Dark Clubbing"],BetterThan:[]},Wreckno:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb4e4f65d366599abcaeaf69fe",Name:"Wreckno",Genres:["Downtemp Bass"],BetterThan:[]},Esseks:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebdf7f3eb9fb7697ee78ffb1b7",Name:"Esseks",Genres:["Experimenal Bass","Glitch Hop"],BetterThan:[]},Jantsen:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb57c88cd5b9329109c1653d36",Name:"Jantsen",Genres:["Brostep","Dubstep","Electronic Trap","Filthstep"],BetterThan:[]},KaiWachi:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb8aadf1695a1036e2f85afc78",Name:"Kai Wachi",Genres:["Brostep","Deathstep","Dubstep","EDM"],BetterThan:[]},Minnesota:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebab8396895eb46d8a8e4e1819",Name:"Minnesota",Genres:["Electronic Trap","Glitch Hop","Vapor Twitch"],BetterThan:[]},Charlesthefirst:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eba41b57944614842146d5aa42",Name:"CharlestheFirst",Genres:["Vapor Twitch"],BetterThan:[]},BlackTigerSexMachine:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb388751478f5e571b4d076809",Name:"Black Tiger Sex Machine",Genres:["Brostep","Canadian Electronic","Dubstep","EDM"],BetterThan:[]},LadyFaith:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb8cdf301e87b7ed46cfddbe71",Name:"Lady Faith",Genres:["Hardstyle"],BetterThan:[]},MikeSaintJules:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb8150c78f0c7e8b36f9661f5c",Name:"Mike Saint-Jules",Genres:["Uplifting Trance","Trance","Progressive House","Progressive Trance"],BetterThan:[]},Fatum:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb42d4f2c722eb3c5aaac4b769",Name:"Fatum",Genres:["EDM","Pop Dance","Progressive House","Progressive Trance"],BetterThan:[]},CrystalSkies:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb6337713a0ed078753a98ebfb",Name:"Crystal Skies",Genres:["EDM","Future Bass","Melodic Dubstep","Pop Dance"],BetterThan:[]},Mitis:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb9d9bef48318d01cae84aa33c",Name:"MitiS",Genres:["Chillstep","EDM","Filthstep","Future Bass"],BetterThan:[]},GardenState:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb2703d9f5a3dfac48df67f4d8",Name:"gardenstate",Genres:["Progressive House"],BetterThan:[]},CosmicGate:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eba3ba56b137a0d342da88e222",Name:"Cosmic Gate",Genres:["EDM","German Techno","German Trance","Pop Dance"],BetterThan:[]},Alpha9:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb1db7115c547519936cdf1ca8",Name:"ALPHA9",Genres:["EDM","Pop Dance","Progressive House","Progressive Trance"],BetterThan:[]},Veil:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb30d86b9146bae541826bfd2e",Name:"Veil",Genres:["Experimental Bass","Deep Dubstep","Downtemp Bass"],BetterThan:[]},Mize:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb4c5a75f128700db9d4d1d8f5",Name:"Mize",Genres:["Downtemp Bass"],BetterThan:[]},Inzo:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb780aaba7765cf031292368cd",Name:"INZO",Genres:["EDM","Future Bass"],BetterThan:[]},Hydraulix:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb88eacb052d3e93a2125710c9",Name:"Hydraulix",Genres:["Dubstep","Electronic Trap"],BetterThan:[]},Luzcid:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebd06f31e516df365969112b7a",Name:"LUZCID",Genres:["Experimental Bass"],BetterThan:[]},ChampagneDrip:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebee8d7bd63658a5790778d6fc",Name:"Champagne Drip",Genres:["Brostep","Dubstep","EDM","Electro House"],BetterThan:[]},Tynan:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb0c284b82a38518919df7a135",Name:"TYNAN",Genres:["Brostep","Dubstep","Electro House","Electronic Trap"],BetterThan:[]},Lsdream:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb9c3a088b53775fe1c1593c9f",Name:"LSDREAM",Genres:["EDM","Electro House","Electronic Trap"],BetterThan:[]},DirtMonkey:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eba3e45314e56b70a08f14b098",Name:"Dirt Monkey",Genres:["Brostep","Dubstep","Electro House","Electronic Trap"],BetterThan:[]},LiquidStranger:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb5063b7e26f7c7fc5e7e065ad",Name:"Liquid Stranger",Genres:["Brostep","Downtempo","Drill and Bass","EDM"],BetterThan:[]},CocoAndBreezy:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb2b9bb48d2ac995c130c08354",Name:"Coco & Breezy",Genres:["Soulful House"],BetterThan:[]},MooreKismet:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb37855ea73c1d7f704280f0fd",Name:"Moore Kismet",Genres:["Dubstep","Electronic Trap","Future Bass","Gaming Dubstep"],BetterThan:[]},ShipWrek:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb98170a22353d3b9987d26031",Name:"Ship Wrek",Genres:["Bass House","Electro House"],BetterThan:[]},PartyPupils:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb7a878b7fc55287dc1a56422f",Name:"Party Pupils",Genres:["Pop EDM"],BetterThan:[]},Jstjr:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebc774251aa87e4257d394b0fd",Name:"JSTJR",Genres:["Moombahton"],BetterThan:[]},Moksi:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebfb61cdc49924dcffd6d053c0",Name:"Moksi",Genres:["Bass House","Dutch EDM","EDM","Electro House"],BetterThan:[]},KQuestionD:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb1bc18e94da95a701a247d278",Name:"k?d",Genres:["Electro house","Future bass"],BetterThan:[]},ValentinoKhan:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb6fc5669eabdb79e9c0978088",Name:"Valentino Khan",Genres:["Bass House","Brostep","EDM","Electro House"],BetterThan:[]},Ekali:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb5944586f169166ac0a03735e",Name:"Ekali",Genres:["Canadian Electronic","EDM","Electro House","Electronic Trap"],BetterThan:[]},AdamBraiman:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb5641bfde4a00d0b4cf320ecb",Name:"Adam Braiman",Genres:[],BetterThan:[]},Westend:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb8849fbc95acf0053406ea4f2",Name:"Westend",Genres:["Bass House","Deep Groove House"],BetterThan:[]},Offaiah:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebd38a1c3706f5a859962491c0",Name:"OFFAIAH",Genres:["Deep Groove House","Deep House","Disco House","EDM"],BetterThan:[]},MartinIkin:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb1fb65abc5834a39623a4def0",Name:"Martin Ikin",Genres:["Bass House","Deep Groove House","Deep House","Disco House"],BetterThan:[]},JohnSummit:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebd303aa4b68de27fb783f5f73",Name:"John Summit",Genres:["EDM","Electro House","House","Pop Dance"],BetterThan:[]},ChrisLorenzo:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebdbf677efa21e32314dc976fb",Name:"Chris Lorenzo",Genres:["Bass House","Deep Groove House","Electro House","House"],BetterThan:[]},SonnyFodera:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebe03987a142f6ba53d230a58c",Name:"Sonny Fodera",Genres:["Dance Pop","Deep Groove House","House","Pop Dance"],BetterThan:[]},ShibaSan:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb7f8ad21c26f4bb76a171381e",Name:"Shiba San",Genres:["Bass House","EDM","Electro House","French Tech House"],BetterThan:[]},Claptone:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb4fc7a1cd0f5b4c5b6f241533",Name:"Claptone",Genres:["Deep Disco House","German House","German Techno","House"],BetterThan:[]},CharlesMeyer:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb42b12f9b6cd181aef7d319fd",Name:"Charles Meyer",Genres:[],BetterThan:[]},KyleKinch:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb0bf10d38d640230902a15332",Name:"Kyle Kinch",Genres:["Bass House","House","Deep Groove House","Funky Tech House"],BetterThan:[]},BrunoFurlan:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebfacb201f06da2290caec29f5",Name:"Bruno Furlan",Genres:["Bass House","Brazilian EDM","Brazilian Tech House"],BetterThan:[]},MasonMaynard:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb93a284bea6a7a4d78d807a4c",Name:"Mason Maynard",Genres:["House"],BetterThan:[]},Drezo:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebc8857231fea0ac8e97eda776",Name:"Drezo",Genres:["Bass House","Electro House"],BetterThan:[]},Destructo:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebbee72dd9b5a9033930b8e15e",Name:"Destructo",Genres:["Bass House","Electro House","Electronic Trap"],BetterThan:[]},DomDolla:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb2c3b19dce6ac8c31ba37fb3e",Name:"Dom Dolla",Genres:["Australian House","Deep Groove House","EDM","Electro House"],BetterThan:[]},Sludge:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebe8664dfe8d58874e5d60bcee",Name:"Sludge",Genres:["Gaming Dubstep","Dubstep","Deathstep","Melodic Dubstep"],BetterThan:[]},Vampa:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb213f8082a20aa066ecc1a0ab",Name:"VAMPA",Genres:["Gaming Dubstep","Dubstep","Electronic Trap","Experimental Bass"],BetterThan:[]},Bommer:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb34ed3c1b51ce068ef1af6cba",Name:"Bommer",Genres:["Dubstep","Gaming Dubstep","Riddim Dubstep"],BetterThan:[]},Hekler:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb0cb692564c5bc6701843a877",Name:"Hekler",Genres:["Deathstep","Dubstep","Electronic Trap","Gaming Dubstep"],BetterThan:[]},Hesh:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebea57a5832bb552eaa08d9b28",Name:"HE$H",Genres:["Deathstep","Dubstep","Gaming Dubstep","Riddim Dubstep"],BetterThan:[]},Gammer:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb98101db98ba89a5fe1b7eab3",Name:"Gammer",Genres:["Electro House","Happy Hardcore","Hardcore Techno"],BetterThan:[]},Atliens:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb6c79c9bcb0e73ad137560a6c",Name:"ATLiens",Genres:["Dubstep","Electro House","Electronic Trap"],BetterThan:[]},Deorro:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb6927317407c8e2499d0cd39f",Name:"Deorro",Genres:["Dance Pop","EDM","Electro House","Melbourne Bounce"],BetterThan:[]},Carnage:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb9dce3cbff297c22fbcd62a96",Name:"Carnage",Genres:["EDM","Electro House","Electronic Trap","Trap"],BetterThan:[]},RiotTen:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb3c8c508e552f563fb4f52e1e",Name:"Riot Ten",Genres:["Dubstep","EDM","Electro House","Electronic Trap"],BetterThan:[]},Ghastly:{ImageURL:"https://i.scdn.co/image/ab6761610000e5ebdd40d9284c4c796a7aff6e9f",Name:"GHASTLY",Genres:["Brostep","Dubstep","EDM","Electro House"],BetterThan:[]},DukeDumont:{ImageURL:"https://i.scdn.co/image/ab6761610000e5eb208e2d15d19c97801c0bd5fc",Name:"Duke Dumont",Genres:["Destroy Techno","EDM","Electro House","House"],BetterThan:[]}};var Festivals={NorthCoast:{Schedule:[["[1]7:00","Illenium","Galantis","Mime","Gryffin"],["[1]7:30","Illenium","PorterRobinson","Diplo","SaidTheSky"]]},ElectricZoo:{Schedule:[["[1]3:00pm","Mime","Heyz","MikeSaintJules","CocoAndBreezy"],["[1]3:15pm","Mime","Heyz","MikeSaintJules","CocoAndBreezy"],["[1]3:30pm","Mime","Heyz","MikeSaintJules","CocoAndBreezy"],["[1]3:45pm","BrunoMartini","Sippy","MikeSaintJules","MooreKismet"],["[1]4:00pm","BrunoMartini","Sippy","MikeSaintJules","MooreKismet"],["[1]4:15pm","SamFeldt","Sippy","MikeSaintJules","MooreKismet"],["[1]4:30pm","SamFeldt","Lick","Fatum","MooreKismet"],["[1]4:45pm","SamFeldt","Lick","Fatum","ShipWrek"],["[1]5:00pm","SamFeldt","Lick","Fatum","ShipWrek"],["[1]5:15pm","Joyryde","Blanke","Fatum","ShipWrek"],["[1]5:30pm","Joyryde","Blanke","CrystalSkies","PartyPupils"],["[1]5:45pm","Joyryde","Blanke","CrystalSkies","PartyPupils"],["[1]6:00pm","Joyryde","Blanke","CrystalSkies","PartyPupils"],["[1]6:15pm","LoudLuxury","Yultron","CrystalSkies","Jstjr"],["[1]6:30pm","LoudLuxury","Yultron","Mitis","Jstjr"],["[1]6:45pm","LoudLuxury","Yultron","Mitis","Jstjr"],["[1]7:00pm","LoudLuxury","BluntsAndBlondes","Mitis","Jstjr"],["[1]7:15pm","Fisher","BluntsAndBlondes","Mitis","Moksi"],["[1]7:30pm","Fisher","BluntsAndBlondes","GardenState","Moksi"],["[1]7:45pm","Fisher","BluntsAndBlondes","GardenState","Moksi"],["[1]8:00pm","Fisher","Peekaboo","GardenState","KQuestionD"],["[1]8:15pm","Fisher","Peekaboo","GardenState","KQuestionD"],["[1]8:30pm","SevenLions","Peekaboo","CosmicGate","KQuestionD"],["[1]8:45pm","SevenLions","Subtronics","CosmicGate","KQuestionD"],["[1]9:00pm","SevenLions","Subtronics","CosmicGate","ValentinoKhan"],["[1]9:15pm","SevenLions","Subtronics","CosmicGate","ValentinoKhan"],["[1]9:30pm","Alesso","Subtronics","CosmicGate","ValentinoKhan"],["[1]9:45pm","Alesso","ZedsDead","Alpha9","ValentinoKhan"],["[1]10:00pm","Alesso","ZedsDead","Alpha9","Ekali"],["[1]10:15pm","Alesso","ZedsDead","Alpha9","Ekali"],["[1]10:30pm","Alesso","ZedsDead","Alpha9","Ekali"],["[1]10:45pm","Alesso","ZedsDead","Alpha9","Ekali"],["[2]1:00pm","Harber","Anakim","Veil","AdamBraiman"],["[2]1:15pm","Harber","Anakim","Veil","AdamBraiman"],["[2]1:30pm","Harber","Anakim","Veil","AdamBraiman"],["[2]1:45pm","Harber","Anakim","Veil","AdamBraiman"],["[2]2:00pm","KillScript","Anakim","Mize","AdamBraiman"],["[2]2:15pm","KillScript","Anakim","Mize","AdamBraiman"],["[2]2:30pm","KillScript","Anakim","Mize","AdamBraiman"],["[2]2:45pm","KillScript","Anakim","Mize","Westend"],["[2]3:00pm","DrFresch","SitaAbellan","Inzo","Westend"],["[2]3:15pm","DrFresch","SitaAbellan","Inzo","Westend"],["[2]3:30pm","DrFresch","SitaAbellan","Inzo","Westend"],["[2]3:45pm","DrFresch","SitaAbellan","Inzo","Offaiah"],["[2]4:00pm","Audien","SitaAbellan","Hydraulix","Offaiah"],["[2]4:15pm","Audien","SitaAbellan","Hydraulix","Offaiah"],["[2]4:30pm","Audien","Rinzen","Hydraulix","Offaiah"],["[2]4:45pm","Audien","Rinzen","Hydraulix","MartinIkin"],["[2]5:00pm","Zomboy","Rinzen","Luzcid","MartinIkin"],["[2]5:15pm","Zomboy","Rinzen","Luzcid","MartinIkin"],["[2]5:30pm","Zomboy","Rinzen","Luzcid","MartinIkin"],["[2]5:45pm","Zomboy","Rinzen","Luzcid","JohnSummit"],["[2]6:00pm","SteveAoki","TownshipRebellion","ChampagneDrip","JohnSummit"],["[2]6:15pm","SteveAoki","TownshipRebellion","ChampagneDrip","JohnSummit"],["[2]6:30pm","SteveAoki","TownshipRebellion","ChampagneDrip","JohnSummit"],["[2]6:45pm","SteveAoki","TownshipRebellion","ChampagneDrip","ChrisLorenzo"],["[2]7:00pm","Tiesto","TownshipRebellion","Tynan","ChrisLorenzo"],["[2]7:15pm","Tiesto","TownshipRebellion","Tynan","ChrisLorenzo"],["[2]7:30pm","Tiesto","Artbat","Tynan","ChrisLorenzo"],["[2]7:45pm","Tiesto","Artbat","Tynan","SonnyFodera"],["[2]8:00pm","Tiesto","Artbat","Lsdream","SonnyFodera"],["[2]8:15pm","Rezz","Artbat","Lsdream","SonnyFodera"],["[2]8:30pm","Rezz","Artbat","Lsdream","SonnyFodera"],["[2]8:45pm","Rezz","Artbat","Lsdream","ShibaSan"],["[2]9:00pm","Rezz","Testpilot","DirtMonkey","ShibaSan"],["[2]9:15pm","Rezz","Testpilot","DirtMonkey","ShibaSan"],["[2]9:30pm","Kaskade","Testpilot","DirtMonkey","ShibaSan"],["[2]9:45pm","Kaskade","Testpilot","DirtMonkey","Claptone"],["[2]10:00pm","Kaskade","Testpilot","LiquidStranger","Claptone"],["[2]10:15pm","Kaskade","Testpilot","LiquidStranger","Claptone"],["[2]10:30pm","Kaskade","Testpilot","LiquidStranger","Claptone"],["[2]10:45pm","Kaskade","Testpilot","LiquidStranger","Claptone"],["[3]1:00pm","NightTales","AceAura","Sludge","CharlesMeyer"],["[3]1:15pm","NightTales","AceAura","Sludge","CharlesMeyer"],["[3]1:30pm","NightTales","AceAura","Vampa","CharlesMeyer"],["[3]1:45pm","NightTales","Swarm","Vampa","CharlesMeyer"],["[3]2:00pm","OverEasy","Swarm","Vampa","CharlesMeyer"],["[3]2:15pm","OverEasy","Swarm","Bommer","CharlesMeyer"],["[3]2:30pm","OverEasy","Swarm","Bommer","CharlesMeyer"],["[3]2:45pm","OverEasy","Wreckno","Hekler","CharlesMeyer"],["[3]3:00pm","Jvna","Wreckno","Hekler","KyleKinch"],["[3]3:15pm","Jvna","Wreckno","Hekler","KyleKinch"],["[3]3:30pm","Jvna","Wreckno","Hesh","KyleKinch"],["[3]3:45pm","Jvna","Esseks","Hesh","KyleKinch"],["[3]4:00pm","AndrewRayel","Esseks","Hesh","BrunoFurlan"],["[3]4:15pm","AndrewRayel","Esseks","Hesh","BrunoFurlan"],["[3]4:30pm","AndrewRayel","Jantsen","Gammer","BrunoFurlan"],["[3]4:45pm","AdventureClub","Jantsen","Gammer","BrunoFurlan"],["[3]5:00pm","AdventureClub","Jantsen","Gammer","MasonMaynard"],["[3]5:15pm","AdventureClub","Jantsen","Gammer","MasonMaynard"],["[3]5:30pm","AdventureClub","KaiWachi","Atliens","MasonMaynard"],["[3]5:45pm","AlanWalker","KaiWachi","Atliens","MasonMaynard"],["[3]6:00pm","AlanWalker","KaiWachi","Atliens","Drezo"],["[3]6:15pm","AlanWalker","KaiWachi","Atliens","Drezo"],["[3]6:30pm","AlanWalker","Minnesota","Deorro","Drezo"],["[3]6:45pm","AlanWalker","Minnesota","Deorro","Drezo"],["[3]7:00pm","Kshmr","Minnesota","Deorro","Destructo"],["[3]7:15pm","Kshmr","Minnesota","Deorro","Destructo"],["[3]7:30pm","Kshmr","Charlesthefirst","Carnage","Destructo"],["[3]7:45pm","Kshmr","Charlesthefirst","Carnage","Destructo"],["[3]8:00pm","Kshmr","Charlesthefirst","Carnage","Destructo"],["[3]8:15pm","Galantis","Charlesthefirst","Carnage","DomDolla"],["[3]8:30pm","Galantis","Charlesthefirst","RiotTen","DomDolla"],["[3]8:45pm","Galantis","BlackTigerSexMachine","RiotTen","DomDolla"],["[3]9:00pm","Galantis","BlackTigerSexMachine","RiotTen","DomDolla"],["[3]9:15pm","Galantis","BlackTigerSexMachine","RiotTen","DomDolla"],["[3]9:30pm","Illenium","BlackTigerSexMachine","RiotTen","DukeDumont"],["[3]9:45pm","Illenium","LadyFaith","Ghastly","DukeDumont"],["[3]10:00pm","Illenium","LadyFaith","Ghastly","DukeDumont"],["[3]10:15pm","Illenium","LadyFaith","Ghastly","DukeDumont"],["[3]10:30pm","Illenium","LadyFaith","Ghastly","DukeDumont"],["[3]10:45pm","Illenium","LadyFaith","Ghastly","DukeDumont"]]}};var data = {Artists:Artists,Festivals:Festivals};

    var data$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Artists: Artists,
        Festivals: Festivals,
        'default': data
    });

    /* src\Card.svelte generated by Svelte v3.49.0 */
    const file$2 = "src\\Card.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (38:16) {#each genres as genre}
    function create_each_block(ctx) {
    	let div;
    	let t_value = /*genre*/ ctx[6] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "badge badge-accent");
    			add_location(div, file$2, 38, 20, 1589);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(38:16) {#each genres as genre}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let h2;
    	let t1_value = /*dataArray*/ ctx[1]["Artists"][/*artist*/ ctx[0]]["Name"] + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let div3;
    	let button;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;
    	let each_value = /*genres*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div3 = element("div");
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			if (!src_url_equal(img.src, img_src_value = /*dataArray*/ ctx[1]["Artists"][/*artist*/ ctx[0]]["ImageURL"])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Artist Logo");
    			attr_dev(img, "class", "rounded-full h-96 aspect-auto object-contain");
    			add_location(img, file$2, 31, 16, 1108);
    			attr_dev(figure, "class", "px-10 pt-2");
    			add_location(figure, file$2, 30, 12, 1063);
    			attr_dev(div0, "class", "box row-start-1 row-span-2 col-start-1 col-span-1");
    			add_location(div0, file$2, 29, 8, 986);
    			attr_dev(h2, "class", "card-title text-6xl");
    			add_location(h2, file$2, 35, 12, 1414);
    			attr_dev(div1, "class", "space-x-1");
    			add_location(div1, file$2, 36, 12, 1503);
    			attr_dev(div2, "class", "box row-start-3 row-span-1 col-start-1 col-span-1 card-body items-center text-center space-y-3 relative");
    			add_location(div2, file$2, 34, 8, 1283);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M5 11l7-7 7 7M5 19l7-7 7 7");
    			add_location(path, file$2, 46, 20, 2100);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-20");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			add_location(svg, file$2, 45, 16, 1954);
    			attr_dev(button, "class", "btn btn-primary btn-square w-72 h-36 relative ");
    			add_location(button, file$2, 43, 12, 1851);
    			attr_dev(div3, "class", "box row-start-4 row-span-1 col-start-1 col-span-1 card-body items-center text-center -mt-9 relative object-scale-down ");
    			add_location(div3, file$2, 42, 8, 1705);
    			attr_dev(div4, "class", "grid overflow-hidden grid-cols-1 grid-rows-4 gap-2 w-full h-full");
    			add_location(div4, file$2, 28, 4, 898);
    			attr_dev(div5, "class", "card bg-base-300 shadow-xl h-fixed w-fixed h-full w-full z-10");
    			add_location(div5, file$2, 27, 0, 817);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, figure);
    			append_dev(figure, img);
    			append_dev(div4, t0);
    			append_dev(div4, div2);
    			append_dev(div2, h2);
    			append_dev(h2, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*Clicked*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*artist*/ 1 && !src_url_equal(img.src, img_src_value = /*dataArray*/ ctx[1]["Artists"][/*artist*/ ctx[0]]["ImageURL"])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*artist*/ 1 && t1_value !== (t1_value = /*dataArray*/ ctx[1]["Artists"][/*artist*/ ctx[0]]["Name"] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*genres*/ 4) {
    				each_value = /*genres*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, []);
    	let { artist = "" } = $$props;
    	let { vote = "" } = $$props;
    	let dataArray = JSON.parse(JSON.stringify(data$1));
    	let genres = dataArray["Artists"][artist]["Genres"];
    	const dispatch = createEventDispatcher();

    	function Clicked() {
    		if (vote === "left") {
    			leftFly.update(n => -800);
    			rightFly.update(n => 800);
    			dispatch('message', { text: "left" });
    		} else if (vote === "right") {
    			leftFly.update(n => 800);
    			rightFly.update(n => -800);
    			dispatch('message', { text: "right" });
    		}
    	}

    	const writable_props = ['artist', 'vote'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('artist' in $$props) $$invalidate(0, artist = $$props.artist);
    		if ('vote' in $$props) $$invalidate(4, vote = $$props.vote);
    	};

    	$$self.$capture_state = () => ({
    		data: data$1,
    		createEventDispatcher,
    		leftFly,
    		rightFly,
    		artist,
    		vote,
    		dataArray,
    		genres,
    		dispatch,
    		Clicked
    	});

    	$$self.$inject_state = $$props => {
    		if ('artist' in $$props) $$invalidate(0, artist = $$props.artist);
    		if ('vote' in $$props) $$invalidate(4, vote = $$props.vote);
    		if ('dataArray' in $$props) $$invalidate(1, dataArray = $$props.dataArray);
    		if ('genres' in $$props) $$invalidate(2, genres = $$props.genres);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [artist, dataArray, genres, Clicked, vote];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { artist: 0, vote: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get artist() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set artist(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vote() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vote(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Eval.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\Eval.svelte";

    // (181:0) {#if cardFlicker}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let card0;
    	let div0_intro;
    	let div0_outro;
    	let t;
    	let div1;
    	let card1;
    	let div1_intro;
    	let div1_outro;
    	let current;

    	card0 = new Card({
    			props: { artist: /*artist*/ ctx[0], vote: "left" },
    			$$inline: true
    		});

    	card0.$on("message", /*handleResult*/ ctx[5]);

    	card1 = new Card({
    			props: {
    				artist: /*artist2*/ ctx[1],
    				vote: "right"
    			},
    			$$inline: true
    		});

    	card1.$on("message", /*handleResult*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(card0.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(card1.$$.fragment);
    			attr_dev(div0, "class", "box w-2/3 h-3/4 justify-self-end");
    			add_location(div0, file$1, 182, 4, 6733);
    			attr_dev(div1, "class", "box w-2/3 h-3/4 justify-self-start");
    			add_location(div1, file$1, 185, 4, 6947);
    			attr_dev(div2, "class", "grid grid-cols-2 grid-rows-1 gap-20 w-full h-full fixed items-center -mt-12");
    			add_location(div2, file$1, 181, 0, 6637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(card0, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(card1, div1, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card0_changes = {};
    			if (dirty & /*artist*/ 1) card0_changes.artist = /*artist*/ ctx[0];
    			card0.$set(card0_changes);
    			const card1_changes = {};
    			if (dirty & /*artist2*/ 2) card1_changes.artist = /*artist2*/ ctx[1];
    			card1.$set(card1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				div0_intro = create_in_transition(div0, fly, { x: -800, duration: 700 });
    				div0_intro.start();
    			});

    			transition_in(card1.$$.fragment, local);

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fly, { x: 800, duration: 700 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fly, { y: /*$leftFly*/ ctx[3], duration: 500 });
    			transition_out(card1.$$.fragment, local);
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fly, { y: /*$rightFly*/ ctx[4], duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(card0);
    			if (detaching && div0_outro) div0_outro.end();
    			destroy_component(card1);
    			if (detaching && div1_outro) div1_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(181:0) {#if cardFlicker}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*cardFlicker*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*cardFlicker*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*cardFlicker*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $festival;
    	let $leftFly;
    	let $rightFly;
    	validate_store(festival, 'festival');
    	component_subscribe($$self, festival, $$value => $$invalidate(6, $festival = $$value));
    	validate_store(leftFly, 'leftFly');
    	component_subscribe($$self, leftFly, $$value => $$invalidate(3, $leftFly = $$value));
    	validate_store(rightFly, 'rightFly');
    	component_subscribe($$self, rightFly, $$value => $$invalidate(4, $rightFly = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Eval', slots, []);
    	let artist;
    	let artist2;
    	let cardFlicker = true;
    	let leftOut = -800;
    	let rightOut = 800;
    	let scheduleArray;
    	let dataArray = JSON.parse(JSON.stringify(data$1));

    	function updateCards() {
    		$$invalidate(2, cardFlicker = false);

    		setTimeout(
    			function () {
    				$$invalidate(2, cardFlicker = true);
    			},
    			600
    		);
    	}

    	function compareBetterThan(a, b) {
    		if (dataArray["Artists"][a]["BetterThan"] > dataArray["Artists"][b]["BetterThan"]) {
    			return -1;
    		}

    		if (dataArray["Artists"][a]["BetterThan"] < dataArray["Artists"][b]["BetterThan"]) {
    			return 1;
    		}

    		return 0;
    	}

    	scheduleArray = dataArray["Festivals"][$festival.replace(/\s/g, '')]["Schedule"];
    	artist = scheduleArray[0][1];
    	artist2 = scheduleArray[0][2];

    	function updateFestival() {
    		if (scheduleArray !== dataArray["Festivals"][$festival.replace(/\s/g, '')]["Schedule"]) {
    			scheduleArray = dataArray["Festivals"][$festival.replace(/\s/g, '')]["Schedule"];
    			$$invalidate(0, artist = scheduleArray[0][1]);
    			$$invalidate(1, artist2 = scheduleArray[0][2]);
    		}
    	}

    	let test = "poop";

    	function handleResult(event) {
    		if (event.detail.text === "left") {
    			dataArray["Artists"][artist]["BetterThan"] = dataArray["Artists"][artist]["BetterThan"].concat(artist2, dataArray["Artists"][artist2]["BetterThan"]);

    			if (artist < artist2) {
    				dataMap.set(artist + "---" + artist2, 1);
    			} else {
    				dataMap.set(artist2 + "---" + artist, 2);
    			}

    			console.log(dataMap);
    		}

    		if (event.detail.text === "right") {
    			dataArray["Artists"][artist2]["BetterThan"] = dataArray["Artists"][artist2]["BetterThan"].concat(artist, dataArray["Artists"][artist]["BetterThan"]);

    			if (artist < artist2) {
    				dataMap.set(artist + "---" + artist2, 2);
    			} else {
    				dataMap.set(artist2 + "---" + artist, 1);
    			}
    		}

    		for (let i = 0; i < scheduleArray.length; i++) {
    			let rowDone = false;
    			console.log("lol2", dataArray["Artists"]["Illenium"]["BetterThan"]);

    			for (let j = 1; j < scheduleArray[i].length; j++) {
    				console.log(scheduleArray[i][j]);
    				let compare1 = dataArray["Artists"][scheduleArray[i][j]]["BetterThan"].concat(scheduleArray[i][j], scheduleArray[i][0]);

    				let containsAll = scheduleArray[i].every(element => {
    					return compare1.includes(element);
    				});

    				for (let y = 0; y < 3; y++) {
    					for (let a = 0; dataArray["Artists"][scheduleArray[i][j]]["BetterThan"].length > a; a++) {
    						dataArray["Artists"][scheduleArray[i][j]]["BetterThan"] = dataArray["Artists"][scheduleArray[i][j]]["BetterThan"].concat(dataArray["Artists"][dataArray["Artists"][scheduleArray[i][j]]["BetterThan"][a]]["BetterThan"]);
    						dataArray["Artists"][scheduleArray[i][j]]["BetterThan"] = [...new Set(dataArray["Artists"][scheduleArray[i][j]]["BetterThan"])];
    					}
    				}

    				if (containsAll) {
    					rowDone = true;
    					console.log("lol");
    					console.log("compare1: " + compare1);
    					break;
    				}
    			}

    			if (!rowDone) {
    				if (scheduleArray[i].length > 5) {
    					console.log("HUUUH");

    					for (let j = scheduleArray[i].length - 1; j > 1; j = j - 4) {
    						let k = j - 3;
    						let check1 = scheduleArray[i][j];
    						let check2 = scheduleArray[i][k];
    						console.log(check1, check2);

    						if (!(dataArray["Artists"][check1]["BetterThan"].includes(check2) || dataArray["Artists"][check2]["BetterThan"].includes(check1))) {
    							$$invalidate(0, artist = check1);
    							$$invalidate(1, artist2 = check2);
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
    					console.log("12", check1, check2);

    					if (!(dataArray["Artists"][check1]["BetterThan"].includes(check2) || dataArray["Artists"][check2]["BetterThan"].includes(check1))) {
    						$$invalidate(0, artist = check1);
    						$$invalidate(1, artist2 = check2);
    						console.log(artist, artist2);
    						return;
    					}
    				}

    				let comparisonArray = JSON.parse(JSON.stringify(scheduleArray[i]));
    				comparisonArray.shift();
    				comparisonArray.sort(compareBetterThan);
    				console.log("comparisonArray: " + comparisonArray);

    				for (let y = 0; y < comparisonArray.length - 1; y++) {
    					for (let z = y + 1; z < comparisonArray.length; z++) {
    						console.log("yz", comparisonArray[y], comparisonArray[z]);

    						if (!(dataArray["Artists"][comparisonArray[y]]["BetterThan"].includes(comparisonArray[z]) || dataArray["Artists"][comparisonArray[z]]["BetterThan"].includes(comparisonArray[y]))) {
    							$$invalidate(0, artist = comparisonArray[y]);
    							$$invalidate(1, artist2 = comparisonArray[z]);
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
    							$$invalidate(0, artist = check1);
    							$$invalidate(1, artist2 = check2);
    							console.log(artist, artist2);
    							return;
    						}
    					}
    				}
    			}
    		}

    		console.log("reached end somehow");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Eval> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		Card,
    		data: data$1,
    		rightFly,
    		leftFly,
    		festival,
    		dataMap,
    		artist,
    		artist2,
    		cardFlicker,
    		leftOut,
    		rightOut,
    		scheduleArray,
    		dataArray,
    		updateCards,
    		compareBetterThan,
    		updateFestival,
    		test,
    		handleResult,
    		$festival,
    		$leftFly,
    		$rightFly
    	});

    	$$self.$inject_state = $$props => {
    		if ('artist' in $$props) $$invalidate(0, artist = $$props.artist);
    		if ('artist2' in $$props) $$invalidate(1, artist2 = $$props.artist2);
    		if ('cardFlicker' in $$props) $$invalidate(2, cardFlicker = $$props.cardFlicker);
    		if ('leftOut' in $$props) leftOut = $$props.leftOut;
    		if ('rightOut' in $$props) rightOut = $$props.rightOut;
    		if ('scheduleArray' in $$props) scheduleArray = $$props.scheduleArray;
    		if ('dataArray' in $$props) dataArray = $$props.dataArray;
    		if ('test' in $$props) test = $$props.test;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*artist, artist2, $festival*/ 67) {
    			{
    				updateCards();
    				updateFestival();
    			}
    		}
    	};

    	return [artist, artist2, cardFlicker, $leftFly, $rightFly, handleResult, $festival];
    }

    class Eval extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Eval",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let navbar;
    	let t;
    	let div1;
    	let eval_1;
    	let current;
    	navbar = new NavBar({ $$inline: true });
    	eval_1 = new Eval({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(navbar.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(eval_1.$$.fragment);
    			attr_dev(div0, "class", "z-30 relative");
    			add_location(div0, file, 7, 0, 109);
    			attr_dev(div1, "class", "z-20 relative");
    			add_location(div1, file, 10, 0, 161);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(navbar, div0, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(eval_1, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(eval_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(eval_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(navbar);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_component(eval_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ NavBar, Eval });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z = "/*\n! tailwindcss v3.1.6 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n:root,\n[data-theme] {\n  background-color: hsla(var(--b1) / var(--tw-bg-opacity, 1));\n  color: hsla(var(--bc) / var(--tw-text-opacity, 1));\n}\n\nhtml {\n  -webkit-tap-highlight-color: transparent;\n}\n\n:root {\n  --p: 321 70% 69%;\n  --pf: 321 70% 55%;\n  --sf: 197 87% 52%;\n  --af: 48 89% 46%;\n  --nf: 253 61% 15%;\n  --b2: 254 59% 23%;\n  --b3: 254 59% 21%;\n  --pc: 321 100% 14%;\n  --sc: 197 100% 13%;\n  --ac: 48 100% 11%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 197 87% 65%;\n  --a: 48 89% 57%;\n  --n: 253 61% 19%;\n  --nc: 260 60% 98%;\n  --b1: 254 59% 26%;\n  --bc: 260 60% 98%;\n  --in: 199 87% 64%;\n  --inc: 257 63% 17%;\n  --su: 168 74% 68%;\n  --suc: 257 63% 17%;\n  --wa: 48 89% 57%;\n  --wac: 257 63% 17%;\n  --er: 352 74% 57%;\n  --erc: 260 60% 98%;\n}\n\n*, ::before, ::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::-webkit-backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\r\n.badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 1.25rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  width: -webkit-fit-content;\n  width: -moz-fit-content;\n  width: fit-content;\n  padding-left: 0.563rem;\n  padding-right: 0.563rem;\n  border-width: 1px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n  border-radius: var(--rounded-badge, 1.9rem);\n}\r\n.btn {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  border-color: transparent;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  text-align: center;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 1em;\n  min-height: 3rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  text-transform: var(--btn-text-case, uppercase);\n  -webkit-text-decoration-line: none;\n  text-decoration-line: none;\n  border-width: var(--border-btn, 1px);\n  -webkit-animation: button-pop var(--animation-btn, 0.25s) ease-out;\n          animation: button-pop var(--animation-btn, 0.25s) ease-out;\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-disabled, \n  .btn[disabled] {\n  pointer-events: none;\n}\r\n.btn-square {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn.loading, \n    .btn.loading:hover {\n  pointer-events: none;\n}\r\n.btn.loading:before {\n  margin-right: 0.5rem;\n  height: 1rem;\n  width: 1rem;\n  border-radius: 9999px;\n  border-width: 2px;\n  -webkit-animation: spin 2s linear infinite;\n          animation: spin 2s linear infinite;\n  content: \"\";\n  border-top-color: transparent;\n  border-left-color: transparent;\n  border-bottom-color: currentColor;\n  border-right-color: currentColor;\n}\r\n@media (prefers-reduced-motion: reduce) {\n\n  .btn.loading:before {\n    -webkit-animation: spin 10s linear infinite;\n            animation: spin 10s linear infinite;\n  }\n}\r\n@-webkit-keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n@keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n.btn-group > input[type=\"radio\"].btn {\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n}\r\n.btn-group > input[type=\"radio\"].btn:before {\n  content: attr(data-title);\n}\r\n.card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.card:focus {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\r\n.card-body {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  padding: var(--padding-card, 2rem);\n  gap: 0.5rem;\n}\r\n.card-body :where(p) {\n  flex-grow: 1;\n}\r\n.card figure {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\r\n.card.image-full {\n  display: grid;\n}\r\n.card.image-full:before {\n  position: relative;\n  content: \"\";\n  z-index: 10;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  opacity: 0.75;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.card.image-full:before, \n    .card.image-full > * {\n  grid-column-start: 1;\n  grid-row-start: 1;\n}\r\n.card.image-full > figure img {\n  height: 100%;\n  -o-object-fit: cover;\n     object-fit: cover;\n}\r\n.card.image-full > .card-body {\n  position: relative;\n  z-index: 20;\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.menu {\n  display: flex;\n  flex-direction: column;\n}\r\n.menu.horizontal {\n  display: inline-flex;\n  flex-direction: row;\n}\r\n.menu.horizontal :where(li) {\n  flex-direction: row;\n}\r\n.menu :where(li) {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  flex-wrap: wrap;\n  align-items: stretch;\n}\r\n.menu :where(li:not(.menu-title)) > :where(*:not(ul)) {\n  display: flex;\n}\r\n.menu :where(li:not(.disabled):not(.menu-title)) > :where(*:not(ul)) {\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  align-items: center;\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\r\n.menu > :where(li > *:not(ul):focus) {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\r\n.menu > :where(li.disabled > *:not(ul):focus) {\n  cursor: auto;\n}\r\n.menu > :where(li) :where(ul) {\n  display: flex;\n  flex-direction: column;\n  align-items: stretch;\n}\r\n.menu > :where(li) > :where(ul) {\n  position: absolute;\n  display: none;\n  top: initial;\n  left: 100%;\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n  border-bottom-right-radius: inherit;\n  border-bottom-left-radius: inherit;\n}\r\n.menu > :where(li:hover) > :where(ul) {\n  display: flex;\n}\r\n.menu > :where(li:focus) > :where(ul) {\n  display: flex;\n}\r\n.navbar {\n  display: flex;\n  align-items: center;\n  padding: var(--navbar-padding, 0.5rem);\n  min-height: 4rem;\n  width: 100%;\n}\r\n:where(.navbar > *) {\n  display: inline-flex;\n  align-items: center;\n}\r\n.btn-outline .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  background-color: transparent;\n}\r\n.btn-outline.btn-primary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--ac) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn:active:hover,\n  .btn:active:focus {\n  -webkit-animation: none;\n          animation: none;\n  transform: scale(var(--btn-focus-scale, 0.95));\n}\r\n.btn:hover, \n    .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n}\r\n.btn:focus-visible {\n  outline: 2px solid hsl(var(--nf));\n  outline-offset: 2px;\n}\r\n.btn-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-primary:hover, \n    .btn-primary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n}\r\n.btn-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn.glass:hover,\n    .btn.glass.btn-active {\n  --glass-opacity: 25%;\n  --glass-border-opacity: 15%;\n}\r\n.btn.glass:focus-visible {\n  outline: 2px solid 0 0 2px currentColor;\n}\r\n.btn-ghost {\n  border-width: 1px;\n  border-color: transparent;\n  background-color: transparent;\n  color: currentColor;\n}\r\n.btn-ghost:hover, \n    .btn-ghost.btn-active {\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n}\r\n.btn-ghost:focus-visible {\n  outline: 2px solid 0 0 2px currentColor;\n}\r\n.btn-outline.btn-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-disabled, \n  .btn-disabled:hover, \n  .btn[disabled], \n  .btn[disabled]:hover {\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.btn.loading.btn-square:before, \n    .btn.loading.btn-circle:before {\n  margin-right: 0px;\n}\r\n.btn.loading.btn-xl:before, \n    .btn.loading.btn-lg:before {\n  height: 1.25rem;\n  width: 1.25rem;\n}\r\n.btn.loading.btn-sm:before, \n    .btn.loading.btn-xs:before {\n  height: 0.75rem;\n  width: 0.75rem;\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn, \n  .btn-group > .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn:focus-visible, .btn-group > .btn-active:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn-group:not(.btn-group-vertical) > .btn:not(:first-of-type) {\n  margin-left: -1px;\n  border-top-left-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n.btn-group:not(.btn-group-vertical) > .btn:not(:last-of-type) {\n  border-top-right-radius: 0px;\n  border-bottom-right-radius: 0px;\n}\r\n.btn-group-vertical > .btn:not(:first-of-type) {\n  margin-top: -1px;\n  border-top-left-radius: 0px;\n  border-top-right-radius: 0px;\n}\r\n.btn-group-vertical > .btn:not(:last-of-type) {\n  border-bottom-right-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n@-webkit-keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n@keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n.card:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}\r\n.card.bordered {\n  border-width: 1px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n}\r\n.card.compact .card-body {\n  padding: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.card-title {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  font-size: 1.25rem;\n  line-height: 1.75rem;\n  font-weight: 600;\n}\r\n@-webkit-keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\n@keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-primary {\n  outline: 2px solid hsl(var(--p));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-ghost {\n  outline: 2px solid currentColor;\n}\r\n.menu.horizontal li.bordered > a, \n        .menu.horizontal li.bordered > button, \n        .menu.horizontal li.bordered > span {\n  border-left-width: 0px;\n  border-bottom-width: 4px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.menu[class*=\" p-\"] li > *, \n  .menu[class^=\"p-\"] li > * {\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.menu :where(li.bordered > *) {\n  border-left-width: 4px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.menu :where(li) > :where(*:not(ul)) {\n  gap: 0.75rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  padding-top: 0.75rem;\n  padding-bottom: 0.75rem;\n  color: currentColor;\n}\r\n.menu :where(li:not(.menu-title):not(:empty)) > :where(*:not(ul):focus), \n  .menu :where(li:not(.menu-title):not(:empty)) > :where(*:not(ul):hover) {\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.1;\n}\r\n.menu :where(li:not(.menu-title):not(:empty)) > :where(:not(ul).active), \n  .menu :where(li:not(.menu-title):not(:empty)) > :where(*:not(ul):active) {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.menu :where(li:empty) {\n  margin-left: 1rem;\n  margin-right: 1rem;\n  margin-top: 0.5rem;\n  margin-bottom: 0.5rem;\n  height: 1px;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.1;\n}\r\n.menu li.disabled > * {\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.menu li.disabled > *:hover {\n  background-color: transparent;\n}\r\n.menu li.hover-bordered a {\n  border-left-width: 4px;\n  border-color: transparent;\n}\r\n.menu li.hover-bordered a:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.menu.compact li > a, \n      .menu.compact li > span {\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.menu .menu-title > * {\n  padding-top: 0.25rem;\n  padding-bottom: 0.25rem;\n  font-size: 0.75rem;\n  line-height: 1rem;\n  font-weight: 700;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.4;\n}\r\n.menu :where(li:not(.disabled)) > :where(*:not(ul)) {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n}\r\n.menu > :where(li:first-child) {\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n  border-bottom-right-radius: unset;\n  border-bottom-left-radius: unset;\n}\r\n.menu > :where(li:first-child) > :where(:not(ul)) {\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n  border-bottom-right-radius: unset;\n  border-bottom-left-radius: unset;\n}\r\n.menu > :where(li:last-child) {\n  border-top-left-radius: unset;\n  border-top-right-radius: unset;\n  border-bottom-right-radius: inherit;\n  border-bottom-left-radius: inherit;\n}\r\n.menu > :where(li:last-child) > :where(:not(ul)) {\n  border-top-left-radius: unset;\n  border-top-right-radius: unset;\n  border-bottom-right-radius: inherit;\n  border-bottom-left-radius: inherit;\n}\r\n.menu > :where(li) > :where(ul) :where(li) {\n  width: 100%;\n  white-space: nowrap;\n}\r\n.menu > :where(li) > :where(ul) :where(li) :where(ul) {\n  padding-left: 1rem;\n}\r\n.menu > :where(li) > :where(ul) :where(li) > :where(:not(ul)) {\n  width: 100%;\n  white-space: nowrap;\n}\r\n.menu > :where(li) > :where(ul) > :where(li:first-child) {\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n  border-bottom-right-radius: unset;\n  border-bottom-left-radius: unset;\n}\r\n.menu > :where(li) > :where(ul) > :where(li:first-child) > :where(:not(ul)) {\n  border-top-left-radius: inherit;\n  border-top-right-radius: inherit;\n  border-bottom-right-radius: unset;\n  border-bottom-left-radius: unset;\n}\r\n.menu > :where(li) > :where(ul) > :where(li:last-child) {\n  border-top-left-radius: unset;\n  border-top-right-radius: unset;\n  border-bottom-right-radius: inherit;\n  border-bottom-left-radius: inherit;\n}\r\n.menu > :where(li) > :where(ul) > :where(li:last-child) > :where(:not(ul)) {\n  border-top-left-radius: unset;\n  border-top-right-radius: unset;\n  border-bottom-right-radius: inherit;\n  border-bottom-left-radius: inherit;\n}\r\n@-webkit-keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n@keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n@-webkit-keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n@keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n@-webkit-keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n@keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n@-webkit-keyframes toast-pop {\n\n  0% {\n    transform: scale(0.9);\n    opacity: 0;\n  }\n\n  100% {\n    transform: scale(1);\n    opacity: 1;\n  }\n}\r\n@keyframes toast-pop {\n\n  0% {\n    transform: scale(0.9);\n    opacity: 0;\n  }\n\n  100% {\n    transform: scale(1);\n    opacity: 1;\n  }\n}\r\n.btn-square:where(.btn-xs) {\n  height: 1.5rem;\n  width: 1.5rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-sm) {\n  height: 2rem;\n  width: 2rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-md) {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-lg) {\n  height: 4rem;\n  width: 4rem;\n  padding: 0px;\n}\r\n.menu-horizontal {\n  display: inline-flex;\n  flex-direction: row;\n}\r\n.menu-horizontal :where(li) {\n  flex-direction: row;\n}\r\n.menu-horizontal > :where(li) > :where(ul) {\n  top: 100%;\n  left: initial;\n}\r\n.badge-accent {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.badge-outline.badge-accent {\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.card-compact .card-body {\n  padding: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\r\n.card-compact .card-title {\n  margin-bottom: 0.25rem;\n}\r\n.card-normal .card-body {\n  padding: var(--padding-card, 2rem);\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\r\n.card-normal .card-title {\n  margin-bottom: 0.75rem;\n}\r\n.menu-horizontal :where(li.bordered > *) {\n  border-left-width: 0px;\n  border-bottom-width: 4px;\n}\r\n.menu-horizontal > :where(li:first-child) {\n  border-top-left-radius: inherit;\n  border-top-right-radius: unset;\n  border-bottom-right-radius: unset;\n  border-bottom-left-radius: inherit;\n}\r\n.menu-horizontal > :where(li:first-child) > :where(*:not(ul)) {\n  border-top-left-radius: inherit;\n  border-top-right-radius: unset;\n  border-bottom-right-radius: unset;\n  border-bottom-left-radius: inherit;\n}\r\n.menu-horizontal > :where(li:last-child) {\n  border-top-left-radius: unset;\n  border-top-right-radius: inherit;\n  border-bottom-right-radius: inherit;\n  border-bottom-left-radius: unset;\n}\r\n.menu-horizontal > :where(li:last-child) > :where(*:not(ul)) {\n  border-top-left-radius: unset;\n  border-top-right-radius: inherit;\n  border-bottom-right-radius: inherit;\n  border-bottom-left-radius: unset;\n}\r\n.fixed {\n  position: fixed;\n}\r\n.relative {\n  position: relative;\n}\r\n.z-30 {\n  z-index: 30;\n}\r\n.z-20 {\n  z-index: 20;\n}\r\n.z-10 {\n  z-index: 10;\n}\r\n.z-40 {\n  z-index: 40;\n}\r\n.col-span-1 {\n  grid-column: span 1 / span 1;\n}\r\n.col-start-1 {\n  grid-column-start: 1;\n}\r\n.row-span-2 {\n  grid-row: span 2 / span 2;\n}\r\n.row-span-1 {\n  grid-row: span 1 / span 1;\n}\r\n.row-start-1 {\n  grid-row-start: 1;\n}\r\n.row-start-3 {\n  grid-row-start: 3;\n}\r\n.row-start-4 {\n  grid-row-start: 4;\n}\r\n.-mt-9 {\n  margin-top: -2.25rem;\n}\r\n.-mt-12 {\n  margin-top: -3rem;\n}\r\n.grid {\n  display: grid;\n}\r\n.aspect-auto {\n  aspect-ratio: auto;\n}\r\n.h-full {\n  height: 100%;\n}\r\n.h-96 {\n  height: 24rem;\n}\r\n.h-36 {\n  height: 9rem;\n}\r\n.h-20 {\n  height: 5rem;\n}\r\n.h-3\\/4 {\n  height: 75%;\n}\r\n.w-full {\n  width: 100%;\n}\r\n.w-72 {\n  width: 18rem;\n}\r\n.w-2\\/3 {\n  width: 66.666667%;\n}\r\n.flex-1 {\n  flex: 1 1 0%;\n}\r\n.grid-cols-1 {\n  grid-template-columns: repeat(1, minmax(0, 1fr));\n}\r\n.grid-cols-2 {\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n}\r\n.grid-rows-4 {\n  grid-template-rows: repeat(4, minmax(0, 1fr));\n}\r\n.grid-rows-1 {\n  grid-template-rows: repeat(1, minmax(0, 1fr));\n}\r\n.items-center {\n  align-items: center;\n}\r\n.gap-2 {\n  gap: 0.5rem;\n}\r\n.gap-20 {\n  gap: 5rem;\n}\r\n.space-y-3 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-y-reverse: 0;\n  margin-top: calc(0.75rem * calc(1 - var(--tw-space-y-reverse)));\n  margin-bottom: calc(0.75rem * var(--tw-space-y-reverse));\n}\r\n.space-x-1 > :not([hidden]) ~ :not([hidden]) {\n  --tw-space-x-reverse: 0;\n  margin-right: calc(0.25rem * var(--tw-space-x-reverse));\n  margin-left: calc(0.25rem * calc(1 - var(--tw-space-x-reverse)));\n}\r\n.justify-self-start {\n  justify-self: start;\n}\r\n.justify-self-end {\n  justify-self: end;\n}\r\n.overflow-hidden {\n  overflow: hidden;\n}\r\n.rounded-full {\n  border-radius: 9999px;\n}\r\n.bg-base-300 {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b3, var(--b2)) / var(--tw-bg-opacity));\n}\r\n.bg-primary {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n}\r\n.bg-accent {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n}\r\n.fill-current {\n  fill: currentColor;\n}\r\n.object-contain {\n  -o-object-fit: contain;\n     object-fit: contain;\n}\r\n.object-scale-down {\n  -o-object-fit: scale-down;\n     object-fit: scale-down;\n}\r\n.p-0 {\n  padding: 0px;\n}\r\n.p-2 {\n  padding: 0.5rem;\n}\r\n.px-10 {\n  padding-left: 2.5rem;\n  padding-right: 2.5rem;\n}\r\n.pt-2 {\n  padding-top: 0.5rem;\n}\r\n.text-center {\n  text-align: center;\n}\r\n.text-6xl {\n  font-size: 3.75rem;\n  line-height: 1;\n}\r\n.text-3xl {\n  font-size: 1.875rem;\n  line-height: 2.25rem;\n}\r\n.font-bold {\n  font-weight: 700;\n}\r\n.normal-case {\n  text-transform: none;\n}\r\n.shadow-xl {\n  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);\n  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\r\n/*My hatred for CSS is present in the emptiness of this file*/\r\n\r\n";
    styleInject(css_248z);

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
