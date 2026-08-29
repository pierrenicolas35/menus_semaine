import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
new_ouvrir = """
      function ouvrirModaleSuggestions() {
        let tousLesArticles = getTousLesIngredients();
        let articlesPrevus = listeCoursesBrute.map(item => normalizeName(item.nom));
        let articlesRestants = tousLesArticles.filter(art => !articlesPrevus.includes(normalizeName(art)));

        let categoriesMap = new Map();
        articlesRestants.forEach(art => {
            let rayon = determinerRayon(art);
            if (!categoriesMap.has(rayon)) {
                categoriesMap.set(rayon, []);
            }
            categoriesMap.get(rayon).push(art);
        });

        let categories = Array.from(categoriesMap.keys()).sort().map(rayon => {
            return {
                categorie: rayon,
                items: categoriesMap.get(rayon).sort((a, b) => a.localeCompare(b))
            };
        });

        let box = document.getElementById('contenu_suggestions_categories');
        let html = '';

        categories.forEach((catGroup, idxCat) => {
          html += `
            <div class="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm shrink-0">
              <div class="bg-slate-50 dark:bg-slate-900 px-3.5 py-2 font-bold text-slate-700 dark:text-slate-300 text-xs flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                <span>${catGroup.categorie}</span>
                <span class="text-[10px] bg-slate-200 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">${catGroup.items.length}</span>
              </div>
              <div class="p-2.5 flex flex-col gap-2">`;

          catGroup.items.forEach((item, idxItem) => {
            let idUnique = `sug_${idxCat}_${idxItem}`;
            let itemSafe = String(item).replace(/"/g, '&quot;');
            let catSafe = catGroup.categorie.replace(/"/g, '&quot;');

            html += `
              <div class="flex gap-2 items-center">
                <div class="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                  <input type="checkbox" id="${idUnique}" class="chk-sug-item peer absolute w-full h-full opacity-0 cursor-pointer" data-nom="${itemSafe}" data-cat="${catSafe}">
                  <i data-lucide="check" class="w-4 h-4 text-emerald-500 opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                </div>
                <label for="${idUnique}" class="flex-grow text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none line-clamp-1">${item}</label>
                <input type="text" placeholder="Qté" class="input-sug-qte w-16 h-8 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg text-center bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
              </div>`;
          });

          html += `</div></div>`;
        });

        if (categories.length === 0) {
            html = '<p class="text-sm text-center text-slate-500 dark:text-slate-400">Aucun article supplémentaire disponible.</p>';
        }

        // Mettre à jour le select d'ajout rapide
        let selectAjout = document.getElementById('nouvelle_sug_cat');
        if (selectAjout) {
            selectAjout.innerHTML = listeRayonsActuelle.map(r => `<option value="${r}">${r}</option>`).join('');
        }

        box.innerHTML = html;
        document.getElementById('modale_suggestions').classList.remove('hidden');
        lucide.createIcons();
      }
"""
content = re.sub(r'function ouvrirModaleSuggestions\(\) \{[\s\S]*?\}\n\n      function fermerModaleSuggestions', new_ouvrir + '\n      function fermerModaleSuggestions', content)
content = re.sub(r'<span>💡</span> Essentiels & Suggestions', r'<span>💡</span> Articles supplémentaires', content)
content = re.sub(r'Complétez votre liste de courses avec les produits du quotidien', r'Complétez votre liste de courses avec les autres articles et produits du quotidien', content)
content = re.sub(r'<select id="nouvelle_sug_cat"[\s\S]*?</select>', r'<select id="nouvelle_sug_cat" class="flex-grow h-10 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-0">\n              </select>', content)

new_ajouter = """
      async function ajouterArticleModalePerso() {
        let inputNom = document.getElementById('nouvelle_sug_nom');
        let selectCat = document.getElementById('nouvelle_sug_cat');
        let nom = inputNom.value.trim();
        let cat = selectCat.value;

        if (!nom) {
          alert("Veuillez saisir un nom pour l'article.");
          return;
        }

        // Ajouter l'article à mappingRayons
        mappingRayons[nom] = cat;

        // Mettre à jour localStorage
        localStorage.setItem('cache_mappingRayons', JSON.stringify(mappingRayons));

        // Vider l'input et rafraîchir
        inputNom.value = '';
        ouvrirModaleSuggestions();

        try {
          await apiPost('sauvegarderRayons', { mapping: mappingRayons });
        } catch(e) {
          console.warn("Erreur lors de la sauvegarde du nouveau rayon.", e);
        }
      }
"""
content = re.sub(r'async function ajouterSuggestionPerso\(\) \{[\s\S]*?\}\n\n      function validerSuggestionsEtVoirCourses', new_ajouter + '\n      function validerSuggestionsEtVoirCourses', content)
content = re.sub(r'onclick="ajouterSuggestionPerso\(\)"', r'onclick="ajouterArticleModalePerso()"', content)
content = re.sub(r'➕ Ajouter une nouvelle suggestion :', r'➕ Ajouter un nouvel article :', content)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
