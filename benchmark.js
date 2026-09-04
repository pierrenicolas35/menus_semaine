const items = [];
for (let i = 0; i < 1000; i++) {
  items.push({nom: 'Ingredient ' + i, quantite: Math.random() > 0.5 ? i : 0, unite: 'g'});
}

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

const N = 10000;

console.time('concatStr');
for (let i = 0; i < N; i++) {
  concatStr();
}
console.timeEnd('concatStr');

console.time('mapJoin');
for (let i = 0; i < N; i++) {
  mapJoin();
}
console.timeEnd('mapJoin');
