const { performance } = require('perf_hooks');

const items = Array.from({length: 20}, (_, i) => ({
    nom: 'Ingredient ' + i,
    quantite: Math.random() > 0.5 ? i : 0,
    unite: 'g'
}));

function concatStr() {
  let h = '<ul class="divide-y divide-slate-100">';
  items.forEach(
    (it) =>
      (h += `<li class="py-2.5 px-1 flex justify-between bg-white dark:bg-slate-800 text-sm"><span class="font-bold text-slate-800 dark:text-slate-200">${it.nom}</span><span class="text-amber-600 font-semibold">${it.quantite > 0 ? it.quantite : ""} ${it.unite}</span></li>`),
  );
  return h + "</ul>";
}

function mapJoin() {
  return '<ul class="divide-y divide-slate-100">' +
    items.map(
      (it) => `<li class="py-2.5 px-1 flex justify-between bg-white dark:bg-slate-800 text-sm"><span class="font-bold text-slate-800 dark:text-slate-200">${it.nom}</span><span class="text-amber-600 font-semibold">${it.quantite > 0 ? it.quantite : ""} ${it.unite}</span></li>`
    ).join('') + "</ul>";
}

function reduceConcat() {
  return '<ul class="divide-y divide-slate-100">' +
    items.reduce(
      (acc, it) => acc + `<li class="py-2.5 px-1 flex justify-between bg-white dark:bg-slate-800 text-sm"><span class="font-bold text-slate-800 dark:text-slate-200">${it.nom}</span><span class="text-amber-600 font-semibold">${it.quantite > 0 ? it.quantite : ""} ${it.unite}</span></li>`, ''
    ) + "</ul>";
}

// Warmup
for (let i = 0; i < 10000; i++) {
  concatStr();
  mapJoin();
  reduceConcat();
}

const N = 500000;

let start = performance.now();
for (let i = 0; i < N; i++) {
  concatStr();
}
let concatTime = performance.now() - start;

start = performance.now();
for (let i = 0; i < N; i++) {
  mapJoin();
}
let mapJoinTime = performance.now() - start;

start = performance.now();
for (let i = 0; i < N; i++) {
  reduceConcat();
}
let reduceTime = performance.now() - start;

console.log(`concatStr: ${concatTime.toFixed(2)}ms`);
console.log(`mapJoin: ${mapJoinTime.toFixed(2)}ms`);
console.log(`reduceConcat: ${reduceTime.toFixed(2)}ms`);
