
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {}
        }
      }


      // Initialisation du thème avant le rendu
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }


      const API_URL = "https://script.google.com/macros/s/AKfycbySlDdnnMmzGoHjFNWW5wOaSX19E1prYj5DrFXZQg0H-jn_k-7RAsGSNmf_f-rqyCr3vg/exec";

      function afficherToastUpdate() {
        let toast = document.getElementById('toast_notification');
        toast.classList.remove('hidden');
        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.remove('opacity-0', 'translate-y-4');
        setTimeout(() => {
          toast.classList.add('opacity-0', 'translate-y-4');
          setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
      }

      let recs = [], plan = [], menusCharges = [], listeCoursesBrute = [];
      let platsSelectionnesBatch = [];
      let cacheDetailsIngredsBatch = {};
      let cacheDetailsRecettes = {};
            let mappingRayons = {}; // Stockage local des rayons d'ingrédients



      const INGREDIENTS_DE_BASE = ["Amandes", "Avocat", "Carotte", "Citron vert ou jaune", "Fromage de chèvre frais", "Huile d'olive", "Œuf", "Quinoa (poids cru)",
        "Ail", "Beurre", "Copeaux de pecorino romano", "Épinards frais", "Farine de blé complet", "Filet de poulet", "Lait demi-écrémé",
        "Muscade", "Oignon blanc", "Pâtes à lasagne", "Ricotta", "Salade verte", "Vinaigre", "Haricots rouges (poids cuit)", "Maïs",
        "Poudre de piment", "Sauce tomate cuisinée", "Steak végétal au soja", "Crème fraîche liquide 15-20%", "Jambon de dinde (sans nitrite)",
        "Noisettes", "Parmesan râpé", "Basilic", "Gnocchis", "Herbes de Provence", "Noix", "Comté", "Emmental râpé", "Endive",
        "Fromage à raclette", "Pâtes crozets au sarrasin", "Boule de mozzarella", "Courgette", "Tomate", "Copeaux de parmesan",
        "Macaroni complets", "Coriandre", "Cumin", "Curry au choix", "Lait de coco", "Lentilles corail (poids cru)", "Tomate pelée",
        "Cream cheese", "Gingembre", "Oignon rouge", "Patate douce", "Aubergine", "Feta", "Olives noires", "Pâtes complètes au choix (poids cru)",
        "Tomates cerises", "Ananas", "Concombre", "Graines de sésame", "Pavé de saumon", "Semoule", "Edamame", "Riz semi-complet (poids cru)",
        "Sauce soja", "Skyr nature", "Melon", "Saumon fumé (bio)", "Cube de légumes", "Graines de courge", "Potimarron",
        "Champignons de Paris", "Asperges", "Echalote", "Persil frais", "Petits pois (poids cuit)", "Boulgour", "Crevettes",
        "Vinaigre balsamique", "Ciboulette", "Lentilles (poids cuit)", "Pain complet", "Tortilla de blé", "Cornichons", "Miel",
        "Moutarde", "Steak haché bœuf 5%", "Steak haché veau 15%", "Thym", "Concentré de tomate", "Bouillon de légumes", "Pain de mie complet", "Pommes", "Bananes", "Citrons", "Oignons", "Ail", "Carottes", "Yaourts", "Lait", "Beurre", "Œufs", "Fromage râpé", "Sopalin", "Sacs poubelle", "Liquide vaisselle", "Lessive", "Éponges", "Papier WC", "Gel douche", "Shampooing", "Dentifrice", "Mouchoirs", "Pain de mie", "Riz", "Pâtes", "Eau minérale", "Café"];

      function getTousLesIngredients() {
        let mapIngredients = new Map();

        const addIngredient = (ing) => {
          if(!ing) return;
          let norm = normalizeName(ing);
          if(!mapIngredients.has(norm)) {
            mapIngredients.set(norm, String(ing));
          }
        };

        INGREDIENTS_DE_BASE.forEach(addIngredient);

        for (let ing of Object.keys(mappingRayons)) {
          addIngredient(ing);
        }

        return Array.from(mapIngredients.values()).sort((a, b) => a.localeCompare(b));
      }

      let listeRayonsActuelle = [
        "🥦 Fruits & Légumes",
        "🧀 Produits Frais & Crémerie",
        "🥩 Boucherie & Poissonnerie",
        "🍝 Épicerie Salée & Conserves",
        "🧹 Produits d'Entretien",
        "🧼 Hygiène & Soins",
        "❄️ Surgelés",
        "🥤 Boissons",
        "🛒 Rayon Divers / Épicerie"
      ];

      function normalizeName(name) {
        if (!name) return "";
        return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }

      function determinerRayon(nomIngredient) {
        let nomNormalise = normalizeName(nomIngredient);
        // Logique "1 ingrédient = 1 rayon" stricte.
        // mappingRayons est alimenté par la fonction getTousLesRayons()
        // La clé doit correspondre exactement après normalisation.
        for (let [ing, rayon] of Object.entries(mappingRayons)) {
            if (normalizeName(ing) === nomNormalise) {
                return rayon;
            }
        }
        // Fallback s'il n'est pas encore assigné
        return "🛒 Rayon Divers / Épicerie";
      }

      async function apiGet(action, params = {}) {
        const queryParams = new URLSearchParams({ action, ...params }).toString();
        const response = await fetch(`${API_URL}?${queryParams}`);
        return await response.json();
      }

      async function apiPost(action, data = {}) {
        const response = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action, ...data })
        });
        return await response.json();
      }


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

      function fermerModaleSuggestions() {
        document.getElementById('modale_suggestions').classList.add('hidden');
      }


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

      function validerSuggestionsEtVoirCourses() {
        let itemsCoches = document.querySelectorAll('.chk-sug-item:checked');

        itemsCoches.forEach(chk => {
          let nom = chk.getAttribute('data-nom');
          let cat = chk.getAttribute('data-cat');
          let parentDiv = chk.closest('div');
          let inputQte = parentDiv ? parentDiv.querySelector('.input-sug-qte') : null;
          let qte = inputQte ? inputQte.value.trim() : "";

          // Ajouter dans la liste de courses
          listeCoursesBrute.push({
            nom: nom,
            quantite: qte,
            unite: "",
            rayonForce: cat
          });
        });

        fermerModaleSuggestions();
        afficherListeCourseTriee();
        changerVue('etape3');
      }

      function passerSuggestions() {
        fermerModaleSuggestions();
        afficherListeCourseTriee();
        changerVue('etape3');
      }

      function getLundiDate(d = new Date()) {
        let day = d.getDay();
        let diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
      }

      function formaterDateLitterale(dateObj) {
        return dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      document.addEventListener('DOMContentLoaded', async function() {
        lucide.createIcons();

        const DELAI_EXPIRATION = 30 * 60 * 1000;
        let dernierAcces = parseInt(localStorage.getItem('dernier_acces') || "0");
        let maintenant = new Date().getTime();
        let vueSauvegardee = 'menu_principal';

        if (maintenant - dernierAcces < DELAI_EXPIRATION) {
          vueSauvegardee = localStorage.getItem('derniere_vue') || 'menu_principal';
        } else {
          localStorage.setItem('derniere_vue', 'menu_principal');
        }

        localStorage.setItem('dernier_acces', maintenant.toString());

        // 1. Charger depuis le cache local (synchrone)
        try {
          let cacheRayons = localStorage.getItem('cache_mappingRayons');
          if (cacheRayons) {
             mappingRayons = JSON.parse(cacheRayons);
             for (let r of Object.values(mappingRayons)) {
               if (r && !listeRayonsActuelle.includes(r)) {
                 listeRayonsActuelle.push(r);
               }
             }
             mettreAJourSelectRayonsGlobal();
          }

          let cacheRecettes = localStorage.getItem('cache_recs');
          if (cacheRecettes) recs = JSON.parse(cacheRecettes);

          let cacheMenus = localStorage.getItem('cache_menusCharges');
          if (cacheMenus) menusCharges = JSON.parse(cacheMenus);


        } catch(e) {
          console.warn("Erreur de lecture du cache", e);
        }

        changerVue(vueSauvegardee, false);

        if (vueSauvegardee === 'vue_menus' && menusCharges && menusCharges.length > 0) {
            chargerMenus();
        }
        if (vueSauvegardee === 'vue_consult') {
          let lastRecipe = localStorage.getItem('derniere_recette');
          if (lastRecipe) {
            setTimeout(() => cuisinerRaccourci(lastRecipe, localStorage.getItem('derniers_couverts') || 5), 300);
          }
        }
        if (vueSauvegardee === 'vue_gerer_rayons') {
           chargerRayonsAdmin();
        }


        // 2. Fetch en arrière-plan et comparaison
        fetchDonneesArrierePlan(vueSauvegardee);
      });

      async function fetchDonneesArrierePlan(vueActuelle) {
        try {
          let hasUpdates = false;

          let [nouveauxRayons, nouvellesRecettes, nouveauxMenus] = await Promise.all([
             apiGet('getTousLesRayons').catch(() => null),
             apiGet('getListeRecettes').catch(() => null),
             apiGet('getMenusSauvegardes').catch(() => null)
          ]);

          if (nouveauxRayons && JSON.stringify(nouveauxRayons) !== JSON.stringify(mappingRayons)) {
             mappingRayons = nouveauxRayons;
             localStorage.setItem('cache_mappingRayons', JSON.stringify(mappingRayons));
             hasUpdates = true;
          }
          if (nouvellesRecettes && JSON.stringify(nouvellesRecettes) !== JSON.stringify(recs)) {
             recs = nouvellesRecettes;
             localStorage.setItem('cache_recs', JSON.stringify(recs));
             hasUpdates = true;
          }
          if (nouveauxMenus && JSON.stringify(nouveauxMenus) !== JSON.stringify(menusCharges)) {
             menusCharges = nouveauxMenus;
             localStorage.setItem('cache_menusCharges', JSON.stringify(menusCharges));
             hasUpdates = true;
          }


          // Synchroniser listeRayonsActuelle si mappingRayons a changé
          if (hasUpdates && nouveauxRayons) {
             for (let r of Object.values(nouveauxRayons)) {
               if (r && !listeRayonsActuelle.includes(r)) {
                 listeRayonsActuelle.push(r);
               }
             }
             mettreAJourSelectRayonsGlobal();
          }

          if (hasUpdates) {
             afficherToastUpdate();
             // Actualiser la vue courante silencieusement si nécessaire
             if (vueActuelle === 'vue_menus') chargerMenus(false); // pass flag
             if (vueActuelle === 'vue_gerer_rayons') chargerRayonsAdmin();

          }
        } catch(e) {
          console.warn("Échec de la mise à jour en arrière-plan", e);
        }
      }

      // --- BATCH COOKING & GUIDAGE GEMINI ---
      async function ouvrirSelectionBatch() {
        changerVue('vue_selection_batch');
        if (!menusCharges || menusCharges.length === 0) {
          menusCharges = await apiGet('getMenusSauvegardes') || [];
        }

        let select = document.getElementById('select_semaine_batch');
        select.innerHTML = '';

        if (!menusCharges || menusCharges.length === 0) {
          document.getElementById('liste_cocher_batch').innerHTML = '<p class="text-center text-xs text-slate-400 py-4">Aucun menu disponible.</p>';
          return;
        }

        menusCharges.forEach((lot) => {
          let labelSemaine = lot.dateDebut
            ? "Semaine du " + formaterDateLitterale(new Date(lot.dateDebut))
            : "Menu (" + lot.date + ")";
          select.innerHTML += `<option value="${lot.id}">${labelSemaine}</option>`;
        });

        chargerPlatsBatchCible();
      }

      function chargerPlatsBatchCible() {
        let idSelected = document.getElementById('select_semaine_batch').value;
        let menuCible = menusCharges.find(m => String(m.id) === String(idSelected));
        let conteneur = document.getElementById('liste_cocher_batch');

        if (!menuCible || !menuCible.repas || menuCible.repas.length === 0) {
          conteneur.innerHTML = '<p class="text-center text-xs text-slate-400 py-4">Aucun plat dans ce menu.</p>';
          return;
        }

        let html = '';
        menuCible.repas.forEach((r, idx) => {
          let titreFormate = (r.titre && r.titre !== "Repas non défini") ? r.titre : "Repas " + (idx + 1);
          let recSafe = String(r.recette).replace(/"/g, '&quot;');
          html += `
            <label class="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer active:bg-slate-50 transition-all">
              <input type="checkbox" class="chk-batch w-5 h-5 rounded-lg text-amber-500 border-slate-300 focus:ring-amber-500" data-recette="${recSafe}" data-couverts="${r.couverts}" data-titre="${titreFormate}" checked>
              <div class="flex flex-col min-w-0 flex-grow">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${titreFormate}</span>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">${r.recette} <span class="text-xs font-normal text-slate-400">(${r.couverts} p.)</span></span>
              </div>
            </label>`;
        });
        conteneur.innerHTML = html;
      }

      async function demarrerSessionCuisine() {
        let cochés = Array.from(document.querySelectorAll('.chk-batch:checked'));
        if (cochés.length === 0) {
          alert("⚠️ Coche au moins 1 plat à cuisiner !");
          return;
        }

        platsSelectionnesBatch = cochés.map(c => ({
          recette: c.getAttribute('data-recette'),
          couverts: parseInt(c.getAttribute('data-couverts')) || 5,
          titre: c.getAttribute('data-titre')
        }));

        cacheDetailsIngredsBatch = {};
        changerVue('vue_session_cuisine');

        let ongletsBox = document.getElementById('onglets_batch');
        let htmlOnglets = '';
        platsSelectionnesBatch.forEach((p, idx) => {
          let activeClass = idx === 0 ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-white text-slate-600 border border-slate-200";
          htmlOnglets += `
            <button type="button" onclick="afficherOngletBatch(${idx})" class="btn-tab-batch font-bold text-xs px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all ${activeClass}" data-idx="${idx}">
              ${p.recette}
            </button>`;
        });
        ongletsBox.innerHTML = htmlOnglets;

        afficherOngletBatch(0);
      }

      async function afficherOngletBatch(index) {
        document.querySelectorAll('.btn-tab-batch').forEach((btn, i) => {
          if (i === index) {
            btn.className = "btn-tab-batch font-bold text-xs px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all bg-amber-500 text-white shadow-md shadow-amber-500/20";
          } else {
            btn.className = "btn-tab-batch font-bold text-xs px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all bg-white text-slate-600 border border-slate-200";
          }
        });

        let plat = platsSelectionnesBatch[index];
        document.getElementById('batch_titre_plat').innerText = plat.recette;
        document.getElementById('batch_parts_plat').innerText = plat.couverts;
        document.getElementById('batch_details_recette').innerHTML = '<p class="p-4 text-center text-slate-400 italic text-sm animate-pulse">Chargement de la fiche...</p>';

        try {
          const items = await apiGet('getDetailsRecette', { nomRecette: plat.recette, nbParts: plat.couverts });
          cacheDetailsIngredsBatch[plat.recette] = items || [];
          cacheDetailsRecettes[getCleCacheRecette(plat.recette, plat.couverts)] = items || [];

          if (!items || items.length === 0) return document.getElementById('batch_details_recette').innerHTML = '<p class="p-4 text-center text-sm">Introuvable.</p>';
          let h = '<ul class="divide-y divide-slate-100">';
          items.forEach(it => h += `<li class="py-2.5 px-1 flex justify-between bg-white dark:bg-slate-800 text-sm"><span class="font-bold text-slate-800 dark:text-slate-200">${it.nom}</span><span class="text-amber-600 font-semibold">${it.quantite > 0 ? it.quantite : ""} ${it.unite}</span></li>`);
          document.getElementById('batch_details_recette').innerHTML = h + '</ul>';
        } catch(e) {
          document.getElementById('batch_details_recette').innerHTML = '<p class="p-4 text-center text-red-500 text-sm">Erreur lors du chargement.</p>';
        }
      }

      // --- LEMENTATION DE LA REQUÊTE BATCH COOKING GEMINI AVEC INGRÉDIENTS DÉTAILLÉS ---
      async function lancerAssistantGeminiBatch() {
        let btn = document.getElementById('btn_gemini_batch');
        let texteOriginal = btn.innerHTML;
        btn.innerHTML = `<span>⏳ Récupération de tous les ingrédients...</span>`;
        btn.disabled = true;

        try {
          let listeCompleteIngredsText = "";

          for (let p of platsSelectionnesBatch) {
            let items = cacheDetailsIngredsBatch[p.recette];
            if (!items) {
              items = await apiGet('getDetailsRecette', { nomRecette: p.recette, nbParts: p.couverts }) || [];
              cacheDetailsIngredsBatch[p.recette] = items;
            }

            listeCompleteIngredsText += `\n📌 Plat : ${p.recette} (${p.couverts} parts)\nIngrédients :\n`;
            items.forEach(it => {
              let qte = it.quantite > 0 ? `${it.quantite} ${it.unite}` : '';
              listeCompleteIngredsText += `- ${it.nom} ${qte}\n`;
            });
          }

          let promptGemini = `Je souhaite lancer une session de Batch Cooking rapide et ultra-efficace pour préparer les repas suivants :

${listeCompleteIngredsText}
Matériel disponible : Thermomix TM5, Four traditionnel, plaques de cuisson.

Consignes à respecter impérativement :
1. Rédige une feuille de route pas-à-pas chronologique et optimisée pour préparer ces plats en parallèle (ex: ce qui cuit au four ou au Thermomix pendant que je découpe les ingrédients).
2. Regroupe les tâches similaires (ex: éplucher/découper tous les légumes en une seule fois).
3. Adopte un ton direct, synthétique, structuré (puces, étapes numérotées) et sans bavardage inutile. L'objectif est la rapidité et l'efficacité maximale.`;

          await navigator.clipboard.writeText(promptGemini);

          alert("✅ Le plan de préparation avec la liste des ingrédients a été copié !\n\nGemini va s'ouvrir : colle simplement le texte dans la zone de saisie (Ctrl+V ou appui long -> Coller).");
          window.open("https://gemini.google.com/app", "_blank");

        } catch(e) {
          alert("Erreur lors de la préparation de la requête Gemini.");
        } finally {
          btn.innerHTML = texteOriginal;
          btn.disabled = false;
        }
      }

      function getProchainLundi() {
        let d = new Date();
        let day = d.getDay();
        let diff = d.getDate() - day + (day === 0 ? -6 : 1);
        let lundi = new Date(d.setDate(diff));
        return lundi.toISOString().split('T')[0];
      }

      function ouvrirPlanification() {
        document.getElementById('edit_menu_id').value = '';
        document.getElementById('titre_edition_menu').innerText = 'Composer le menu';
        document.getElementById('date_debut_menu').value = getProchainLundi();
        document.getElementById('form_repas').innerHTML = '';
        ajouterBlocRepas();
        changerVue('etape2');
      }

      function changerVue(id, sauver = true) {
        document.querySelectorAll('.etape').forEach(e => e.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');

        localStorage.setItem('dernier_acces', new Date().getTime().toString());
        if (sauver) {
          localStorage.setItem('derniere_vue', id);
        }

        if(id === 'vue_consult') {
          let optionsSafe = (recs || []).map(r => `<option value="${String(r).replace(/"/g, '&quot;')}">${String(r)}</option>`).join('');
          let currentSelect = document.getElementById('select_consult').value;
          document.getElementById('select_consult').innerHTML = '<option value="">Sélectionner une recette...</option>' + optionsSafe;
          if (currentSelect) document.getElementById('select_consult').value = currentSelect;
        }
        if(id === 'vue_modifier_recette') {
          let optionsSafe = (recs || []).map(r => `<option value="${String(r).replace(/"/g, '&quot;')}">${String(r)}</option>`).join('');
          document.getElementById('edit_recette_select').innerHTML = '<option value="">Sélectionnez une recette...</option>' + optionsSafe;
          document.getElementById('edit_recette_zone').classList.add('hidden');
          document.getElementById('edit_recette_select').value = "";
        }

        if(id === 'vue_gerer_rayons') {
          chargerRayonsAdmin();
        }
        if (id === 'vue_ajout' || id === 'vue_modifier_recette') {
          mettreAJourDatalistArticles();
        }
        setTimeout(() => lucide.createIcons(), 50);
      }

      function mettreAJourDatalistArticles() {
        let datalist = document.getElementById('datalist_articles');
        if (datalist) {
          let ingredients = getTousLesIngredients();
          datalist.innerHTML = ingredients.map(ing => `<option value="${String(ing).replace(/"/g, '&quot;')}">`).join('');
        }
      }

      function verifierIngredientExistant(inputElement) {
        let val = inputElement.value.trim();
        if (!val) return;

        let ingredients = getTousLesIngredients();
        let valNormalisee = normalizeName(val);

        let existeDeja = ingredients.some(ing => normalizeName(ing) === valNormalisee);

        if (!existeDeja) {
          // L'article n'existe pas, on ouvre la modale
          document.getElementById('nouvel_ing_rapide_nom_display').innerText = val;
          document.getElementById('nouvel_ing_rapide_nom_val').value = val;
          document.getElementById('nouvel_ing_rapide_input_ref').value = inputElement.id;

          let selectRayon = document.getElementById('nouvel_ing_rapide_rayon');
          selectRayon.innerHTML = listeRayonsActuelle.map(r => `<option value="${r}">${r}</option>`).join('');

          document.getElementById('modale_nouvel_ing_rapide').classList.remove('hidden');
        }
      }

      function annulerNouvelIngRapide() {
        document.getElementById('modale_nouvel_ing_rapide').classList.add('hidden');
        let ref = document.getElementById('nouvel_ing_rapide_input_ref').value;
        if (ref) {
          let input = document.getElementById(ref);
          if (input) input.value = ''; // On efface la valeur puisqu'elle a été annulée
        }
      }

      function validerNouvelIngRapide() {
        let nom = document.getElementById('nouvel_ing_rapide_nom_val').value.trim();
        let rayon = document.getElementById('nouvel_ing_rapide_rayon').value;

        if (nom && rayon) {
          mappingRayons[nom] = rayon;
          mettreAJourDatalistArticles();
          alert(`L'article "${nom}" a bien été associé au rayon "${rayon}". (N'oubliez pas de sauvegarder les rayons plus tard si besoin)`);
        }
        document.getElementById('modale_nouvel_ing_rapide').classList.add('hidden');
      }

      function getCleCacheRecette(recette, couverts) {
        return `${String(recette || '').trim().toLowerCase()}::${parseInt(couverts) || 1}`;
      }

      function mettreAJourBoutonIngredientsCarte(selectEl) {
        let card = selectEl.closest('.repas-card');
        if (!card) return;

        let btn = card.querySelector('.btn-ingredients-programmation');
        if (!btn) return;

        if (selectEl.value) {
          btn.classList.remove('hidden');
          btn.disabled = false;
        } else {
          btn.classList.add('hidden');
          btn.disabled = true;
        }
      }

      function ouvrirIngredientsDepuisCarte(btn) {
        let card = btn.closest('.repas-card');
        if (!card) return;

        let select = card.querySelector('.recette');
        let couvertsInput = card.querySelector('.couverts');
        if (!select || !select.value) return;

        ouvrirPopupIngredientsMenu(select.value, parseInt(couvertsInput?.value) || 1);
      }

      function ajouterBlocRepas(donneesRepas = null) {
        const conteneur = document.getElementById('form_repas');
        const optionsHTML = '<option value="">Sélectionne une recette</option>' + (recs || []).map(r => `<option value="${String(r).replace(/"/g, '&quot;')}">${String(r)}</option>`).join('');

        const joursData = [
          { label: 'Lu', val: 'lundi' }, { label: 'Ma', val: 'mardi' }, { label: 'Me', val: 'mercredi' },
          { label: 'Je', val: 'jeudi' }, { label: 'Ve', val: 'vendredi' }, { label: 'Sa', val: 'samedi' }, { label: 'Di', val: 'dimanche' }
        ];

        let gridHTML = '<div class="grid grid-cols-7 gap-1 mt-3 mb-2">';
        joursData.forEach(j => {
          gridHTML += `
            <div class="flex flex-col gap-1 items-center">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">${j.label}</span>
              <button type="button" class="slot-btn w-full aspect-square min-h-[40px] rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 text-base border border-slate-200 dark:border-slate-700 active:scale-90 transition-all flex items-center justify-center" data-val="${j.val} midi" onclick="toggleSlot(this)">☀️</button>
              <button type="button" class="slot-btn w-full aspect-square min-h-[40px] rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 text-base border border-slate-200 dark:border-slate-700 active:scale-90 transition-all flex items-center justify-center" data-val="${j.val} soir" onclick="toggleSlot(this)">🌙</button>
            </div>`;
        });
        gridHTML += '</div>';

        let cardIndex = conteneur.children.length + 1;
        let cardHTML = `
          <div class="repas-card bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-indigo-600 flex flex-col gap-2 relative">
            ${cardIndex > 1 ? `<button type="button" onclick="this.closest('.repas-card').remove()" class="absolute top-2 right-2 w-8 h-8 text-slate-400 hover:text-red-500 flex items-center justify-center text-sm font-bold">✕</button>` : ''}
            <div class="flex flex-col mb-1 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
              <span class="titre-display text-sm font-bold text-slate-400 leading-tight">Sélectionne les créneaux 👇</span>
              <input type="hidden" class="titre" value="Repas non défini">
            </div>
            ${gridHTML}

            <div class="flex items-center justify-between gap-2 mt-2">
              <label class="font-semibold text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">Nbr de parts :</label>
              <div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                <button type="button" onclick="modifierPartsCard(this, -1)" class="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-lg active:bg-slate-200 transition-all flex items-center justify-center">−</button>
                <span class="couverts-val w-12 text-center font-bold text-slate-800 dark:text-slate-200 text-sm">5</span>
                <input type="hidden" class="couverts" value="5">
                <button type="button" onclick="modifierPartsCard(this, 1)" class="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-lg active:bg-slate-200 transition-all flex items-center justify-center">+</button>
              </div>
            </div>

            <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 mt-1 w-full">
              <select onchange="mettreAJourBoutonIngredientsCarte(this)" class="recette w-full min-w-0 min-h-[44px] text-sm px-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
                ${optionsHTML}
              </select>
              <button type="button" onclick="ouvrirIngredientsDepuisCarte(this)" class="btn-ingredients-programmation hidden shrink-0 min-h-[44px] whitespace-nowrap px-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all" disabled>
                Ingrédients
              </button>
            </div>
          </div>`;

        conteneur.insertAdjacentHTML('beforeend', cardHTML);

        if (donneesRepas) {
          let derniereCard = conteneur.lastElementChild;
          if (donneesRepas.recette) derniereCard.querySelector('.recette').value = donneesRepas.recette;
          if (donneesRepas.couverts) {
            derniereCard.querySelector('.couverts').value = donneesRepas.couverts;
            derniereCard.querySelector('.couverts-val').innerText = donneesRepas.couverts;
          }
          if (donneesRepas.titre) {
            let slotsFormates = donneesRepas.titre.toLowerCase();
            derniereCard.querySelectorAll('.slot-btn').forEach(btn => {
              let val = btn.getAttribute('data-val');
              if (slotsFormates.includes(val)) {
                toggleSlot(btn);
              }
            });
          }
          mettreAJourBoutonIngredientsCarte(derniereCard.querySelector('.recette'));
        }
      }

      function modifierPartsCard(btn, delta) {
        let parent = btn.closest('div');
        let valSpan = parent.querySelector('.couverts-val');
        let inputHidden = parent.querySelector('.couverts');
        let valActuelle = parseInt(inputHidden.value) || 5;
        let nouvelleVal = Math.max(1, valActuelle + delta);
        valSpan.innerText = nouvelleVal;
        inputHidden.value = nouvelleVal;
      }

      function modifierPartsConsult(delta) {
        let valSpan = document.getElementById('parts_consult_val');
        let valActuelle = parseInt(valSpan.innerText) || 5;
        let nouvelleVal = Math.max(1, valActuelle + delta);
        valSpan.innerText = nouvelleVal;
        afficherDetails();
      }

      function toggleSlot(btn) {
        btn.classList.toggle('bg-blue-100');
        btn.classList.toggle('border-blue-400');
        btn.classList.toggle('bg-slate-100');
        btn.classList.toggle('border-slate-200');

        let card = btn.closest('.repas-card');
        let actives = card.querySelectorAll('.slot-btn.bg-blue-100');
        let titleDisplay = card.querySelector('.titre-display');
        let titleInput = card.querySelector('.titre');

        if (actives.length > 0) {
            let slotsArr = Array.from(actives).map(b => b.getAttribute('data-val'));
            let slotsFormates = "";

            if (slotsArr.length === 1) {
              slotsFormates = slotsArr[0];
            } else {
              let dernier = slotsArr.pop();
              slotsFormates = slotsArr.join(', ') + ' et ' + dernier;
            }

            slotsFormates = slotsFormates.charAt(0).toUpperCase() + slotsFormates.slice(1);
            titleDisplay.innerText = slotsFormates;
            titleInput.value = slotsFormates;
            titleDisplay.classList.remove('text-slate-400');
            titleDisplay.classList.add('text-indigo-700');
        } else {
            titleDisplay.innerText = "Sélectionne les créneaux 👇";
            titleInput.value = "Repas non défini";
            titleDisplay.classList.add('text-slate-400');
            titleDisplay.classList.remove('text-indigo-700');
        }
      }


      async function chargerMenus(shouldChangeVue = true) {
        if (shouldChangeVue) {
            changerVue('vue_menus');
        }

        try {
          let box = document.getElementById('conteneur_menus');
          if(!menusCharges || menusCharges.length === 0) {
            box.innerHTML = '<p class="text-center text-slate-500 dark:text-slate-400 mt-4 text-sm">Aucun menu planifié.</p>';
            return;
          }

          const aujourdhui = new Date();
          aujourdhui.setHours(0,0,0,0);

          let menuCourant = [];
          let menusSuivants = [];
          let menusPasses = [];

          menusCharges.forEach((lot) => {
            if (lot.dateDebut) {
              let debut = new Date(lot.dateDebut);
              let fin = new Date(lot.dateDebut);
              fin.setDate(fin.getDate() + 6);

              if (aujourdhui >= debut && aujourdhui <= fin) {
                menuCourant.push(lot);
              } else if (aujourdhui < debut) {
                menusSuivants.push(lot);
              } else {
                menusPasses.push(lot);
              }
            } else {
              // S'il n'a pas de date de début, on le met dans "suivants" par défaut ou "courant" si on en n'a pas encore.
              menusSuivants.push(lot);
            }
          });

          // Trier les menus suivants par ordre chronologique
          menusSuivants.sort((a, b) => {
            if (!a.dateDebut) return 1;
            if (!b.dateDebut) return -1;
            return new Date(a.dateDebut) - new Date(b.dateDebut);
          });

          // Trier les menus passés par ordre anti-chronologique
          menusPasses.sort((a, b) => {
            if (!a.dateDebut) return 1;
            if (!b.dateDebut) return -1;
            return new Date(b.dateDebut) - new Date(a.dateDebut);
          });

          let html = '';

          const renderMenu = (lot, titreBloc, badgeColor, dateAffichee) => {
            return `<div class="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border-2 ${badgeColor}">
                      <div class="flex justify-between items-center border-b pb-2 mb-3">
                        <div>
                          <h3 class="font-black text-slate-700 dark:text-slate-300 text-sm">${titreBloc}</h3>
                          <span class="text-xs text-slate-400 font-medium">${dateAffichee}</span>
                        </div>
                        <div class="flex flex-wrap items-center justify-end gap-2">
                          <button type="button" onclick="ouvrirModalePartage('${lot.id}')" class="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 active:scale-95 transition-all">📤 Partager</button>
                          <button type="button" onclick="editerMenuExistant('${lot.id}')" class="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 active:scale-95 transition-all">✏️ Modifier</button>
                          <button type="button" onclick="supprimerMenuExistant('${lot.id}')" class="bg-red-50 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200 active:scale-95 transition-all">🗑️ Supprimer</button>
                        </div>
                      </div>
                      <div class="flex flex-col gap-2">` +
            lot.repas.map(r => {
              let recSafe = String(r.recette).replace(/'/g, "\\\'").replace(/"/g, '&quot;');
              let titreFormate = (r.titre && r.titre !== "Repas non défini") ? r.titre : "Repas";
              return `
                <div onclick="cuisinerRaccourci('${recSafe}', ${r.couverts})" class="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 active:bg-slate-100 active:scale-95 transition-all cursor-pointer">
                  <p class="font-bold text-indigo-700 text-xs mb-1">${titreFormate}</p>
                  <p class="text-slate-600 dark:text-slate-300 text-xs flex justify-between items-center">
                    <span>🍲 ${r.recette} <span class="text-[10px] opacity-70">(${r.couverts} parts)</span></span>
                    <span class="flex items-center gap-1.5">
                      <span class="text-[10px] bg-white dark:bg-slate-800 border px-2 py-0.5 rounded-md font-medium shadow-sm">👉 Cuisiner</span>
                    </span>
                  </p>
                </div>`;
            }).join('') + `</div></div>`;
          };

          menuCourant.forEach((lot) => {
            let dateAffichee = lot.dateDebut ? "Semaine du " + formaterDateLitterale(new Date(lot.dateDebut)) : "Créé le " + lot.date;
            html += renderMenu(lot, "🟢 Menu de la semaine en cours", "border-emerald-500", dateAffichee);
          });

          menusSuivants.forEach((lot) => {
            let dateAffichee = lot.dateDebut ? "Semaine du " + formaterDateLitterale(new Date(lot.dateDebut)) : "Créé le " + lot.date;
            html += renderMenu(lot, "🔵 Menu de la semaine prochaine", "border-blue-500", dateAffichee);
          });

          if (menusPasses.length > 0) {
            html += `<details class="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 group overflow-hidden mt-4">
                       <summary class="cursor-pointer font-bold text-slate-700 dark:text-slate-300 text-sm p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-between border-b border-slate-200/0 group-open:border-slate-200 transition-all">
                         <span>🕰️ Menus Passés (${menusPasses.length})</span>
                         <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform"></i>
                       </summary>
                       <div class="p-4 flex flex-col gap-4 bg-slate-50/50">`;

            menusPasses.forEach((lot) => {
              let dateAffichee = lot.dateDebut ? "Semaine du " + formaterDateLitterale(new Date(lot.dateDebut)) : "Créé le " + lot.date;
              html += renderMenu(lot, "⚪ Menu passé", "border-slate-300", dateAffichee);
            });

            html += `  </div>
                     </details>`;
          }

          box.innerHTML = html;
          setTimeout(() => lucide.createIcons(), 50); // Mettre à jour les icônes lucide dans le details
        } catch(e) {
          document.getElementById('conteneur_menus').innerHTML = '<p class="text-center text-red-500 mt-4 text-sm">Erreur lors du chargement.</p>';
        }
      }

      function editerMenuExistant(idMenu) {
        let lot = menusCharges.find(m => String(m.id) === String(idMenu));
        if (!lot) return;

        document.getElementById('edit_menu_id').value = lot.id;
        document.getElementById('titre_edition_menu').innerText = 'Modifier le menu';
        if (lot.dateDebut) document.getElementById('date_debut_menu').value = lot.dateDebut;

        document.getElementById('form_repas').innerHTML = '';
        lot.repas.forEach(repas => {
          ajouterBlocRepas(repas);
        });

        changerVue('etape2');
      }

      async function supprimerMenuExistant(idMenu) {
        let lot = menusCharges.find(m => String(m.id) === String(idMenu));
        if (!lot) return;

        let etiquette = lot.dateDebut ? `la semaine du ${formaterDateLitterale(new Date(lot.dateDebut))}` : "ce menu";
        if (!confirm(`Supprimer définitivement ${etiquette} ?`)) return;

        try {
          await apiPost('sauvegarderMenu', { plan: [], dateDebutStr: lot.dateDebut || '', idMenuExistant: lot.id });
          menusCharges = menusCharges.filter(m => String(m.id) !== String(idMenu));
          localStorage.setItem('cache_menusCharges', JSON.stringify(menusCharges));

          if (String(document.getElementById('edit_menu_id').value) === String(idMenu)) {
            document.getElementById('edit_menu_id').value = '';
            document.getElementById('titre_edition_menu').innerText = 'Composer le menu';
            document.getElementById('date_debut_menu').value = getProchainLundi();
            document.getElementById('form_repas').innerHTML = '';
          }

          await chargerMenus();
        } catch(e) {
          alert("Erreur lors de la suppression du menu.");
        }
      }

      function cuisinerRaccourci(recette, couverts) {
        localStorage.setItem('derniere_recette', recette);
        localStorage.setItem('derniers_couverts', couverts);
        changerVue('vue_consult');
        document.getElementById('select_consult').value = recette;
        document.getElementById('parts_consult_val').innerText = couverts;
        afficherDetails();
      }

      async function calcul() {
        let blocks = document.querySelectorAll('.repas-card');
        let err = false;
        plan = [];

        blocks.forEach(b => {
          let sel = b.querySelector('.recette');
          let couv = b.querySelector('.couverts');
          if(!sel || !sel.value) {
            if(sel) sel.classList.add('input-error');
            err = true;
          } else {
            if(sel) sel.classList.remove('input-error');
            plan.push({ nom: b.querySelector('.titre').value, recette: sel.value, couverts: parseInt(couv.value) || 1 });
          }
        });

        let msgBox = document.getElementById('msg_erreur');
        if(err) { msgBox.classList.remove('hidden'); return; } else { msgBox.classList.add('hidden'); }

        const dateDebutStr = document.getElementById('date_debut_menu').value;
        const idMenuExistant = document.getElementById('edit_menu_id').value;

        apiPost('sauvegarderMenu', { plan: plan, dateDebutStr: dateDebutStr, idMenuExistant: idMenuExistant });

        // Mettre à jour le cache local pour le nouveau menu créé en optimiste ? Pas de retour d'ID du backend ici, on va laisser le fetch background s'en occuper
        // ou on relance le fetch
        fetchDonneesArrierePlan('etape2');

        try {
          listeCoursesBrute = await apiPost('calculerCourses', { planification: plan }) || [];
          ouvrirModaleSuggestions();
        } catch(e) {
          alert("Erreur lors du calcul du menu.");
        }
      }

      // --- GESTION DU PARTAGE AVEC MODALE ---
      async function ouvrirModalePartage(idPreselectionne = null) {
        try {
          let select = document.getElementById('select_partage_menu');
          select.innerHTML = '';

          if (!menusCharges || menusCharges.length === 0) {
            alert("Aucun menu planifié n'est disponible pour le partage.");
            return;
          }

          menusCharges.forEach((lot, idx) => {
            let labelSemaine = lot.dateDebut
              ? "Semaine du " + formaterDateLitterale(new Date(lot.dateDebut))
              : "Menu " + (idx + 1) + " (" + lot.date + ")";
            select.innerHTML += `<option value="${lot.id}">${labelSemaine}</option>`;
          });

          if (idPreselectionne) {
            select.value = idPreselectionne;
          }

          document.getElementById('modale_partage').classList.remove('hidden');
        } catch(e) {
          alert("Erreur lors de la récupération des menus.");
        }
      }

      function fermerModalePartage() {
        document.getElementById('modale_partage').classList.add('hidden');
      }

      function fermerPopupIngredientsMenu() {
        document.getElementById('modale_ingredients_programme').classList.add('hidden');
      }

      function afficherIngredientsProgramme(items) {
        if (!items || items.length === 0) {
          document.getElementById('contenu_ingredients_programme').innerHTML = '<p class="p-4 text-center text-sm text-slate-500 dark:text-slate-400">Aucun ingrédient trouvé.</p>';
          return;
        }

        let h = '<ul class="divide-y divide-slate-100">';
        items.forEach(it => h += `<li class="p-3 flex justify-between bg-white dark:bg-slate-800"><span class="font-bold text-slate-800 dark:text-slate-200 text-sm">${it.nom}</span><span class="text-emerald-600 font-semibold text-sm">${it.quantite > 0 ? it.quantite : ""} ${it.unite}</span></li>`);
        document.getElementById('contenu_ingredients_programme').innerHTML = h + '</ul>';
      }

      async function ouvrirPopupIngredientsMenu(recette, couverts) {
        const cleCache = getCleCacheRecette(recette, couverts);
        document.getElementById('titre_ingredients_programme').innerText = `Ingrédients • ${recette}`;
        document.getElementById('modale_ingredients_programme').classList.remove('hidden');

        if (cacheDetailsRecettes[cleCache]) {
          afficherIngredientsProgramme(cacheDetailsRecettes[cleCache]);
          return;
        }

        document.getElementById('contenu_ingredients_programme').innerHTML = '<p class="p-4 text-center text-slate-500 dark:text-slate-400 font-bold animate-pulse text-sm">Chargement...</p>';

        try {
          const items = await apiGet('getDetailsRecette', { nomRecette: recette, nbParts: couverts || 1 });
          cacheDetailsRecettes[cleCache] = items || [];
          afficherIngredientsProgramme(items || []);
        } catch(e) {
          document.getElementById('contenu_ingredients_programme').innerHTML = '<p class="p-4 text-center text-red-500 text-sm">Erreur lors du chargement.</p>';
        }
      }

      async function executerPartageModale(type) {
        let idSelected = document.getElementById('select_partage_menu').value;
        let menuCible = menusCharges.find(m => String(m.id) === String(idSelected));

        if (!menuCible) {
          alert("Menu introuvable.");
          return;
        }

        let planTarget = menuCible.repas || [];
        let dateInput = menuCible.dateDebut || "";
        let dateFormatee = dateInput ? formaterDateLitterale(new Date(dateInput)) : "sélectionnée";

        let txt = "";

        if (type === 'Menu') {
          txt = `🍽️ MENUS POUR LA SEMAINE DU ${dateFormatee.toUpperCase()} :\n\n`;
          planTarget.forEach(p => {
            let titreFormate = (p.nom && p.nom !== "Repas non défini") ? p.nom : "Repas";
            txt += `🗓️ ${titreFormate}\n👉 ${p.recette} (${p.couverts} parts)\n\n`;
          });
          finaliserEnvoiTexte(txt);
        } else {
          try {
            let coursesExport = [];
            let dateKey = dateInput || 'sans_date';
            let savedCourses = localStorage.getItem('courses_' + dateKey);
            if (savedCourses) {
                try {
                    coursesExport = JSON.parse(savedCourses);
                } catch(e) {
                    coursesExport = await apiPost('calculerCourses', { planification: planTarget }) || [];
                }
            } else {
                coursesExport = await apiPost('calculerCourses', { planification: planTarget }) || [];
            }
            txt = `🛒 LISTE DE COURSES POUR LA SEMAINE DU ${dateFormatee.toUpperCase()} :\n\n`;

            let groupes = {};
            coursesExport.forEach(item => {
              let rayon = item.rayonForce || determinerRayon(item.nom);
              if (!groupes[rayon]) groupes[rayon] = [];
              groupes[rayon].push(item);
            });

            for (let [rayon, items] of Object.entries(groupes)) {
              txt += `--- ${rayon.toUpperCase()} ---\n`;
              items.forEach(item => {
                let qte = item.quantite ? ` (${item.quantite} ${item.unite})` : '';
                txt += `- ${item.nom}${qte}\n`;
              });
              txt += `\n`;
            }
            finaliserEnvoiTexte(txt);
          } catch(e) {
            alert("Erreur lors de la génération de la liste de courses.");
          }
        }
      }

      function finaliserEnvoiTexte(txt) {
        fermerModalePartage();
        if (navigator.share) {
          navigator.share({ title: "Chef Perso - Partage", text: txt });
        } else {
          navigator.clipboard.writeText(txt).then(() => alert("Copié dans le presse-papier !"));
        }
      }

      function afficherListeCourseTriee() {
        let dateInput = document.getElementById('date_debut_menu').value || "sans_date";
        localStorage.setItem('courses_' + dateInput, JSON.stringify(listeCoursesBrute));
        let conteneur = document.getElementById('conteneur_rayons');

        if (!listeCoursesBrute || listeCoursesBrute.length === 0) {
          conteneur.innerHTML = '<p class="p-4 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 rounded-2xl shadow-sm">Aucun ingrédient trouvé.</p>';
          return;
        }

        let groupes = {};
        listeCoursesBrute.forEach(item => {
          let rayon = item.rayonForce || determinerRayon(item.nom);
          if (!groupes[rayon]) groupes[rayon] = [];
          groupes[rayon].push(item);
        });

        let html = '';
        for (let [rayon, items] of Object.entries(groupes)) {
          html += `
            <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div class="bg-slate-100/80 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                ${rayon}
              </div>
              <ul class="divide-y divide-slate-100">`;

          items.forEach(item => {
            let qteAffichee = (item.quantite !== undefined && item.quantite !== null && item.quantite !== 0) ? item.quantite : "";
            let uniteAffichee = item.unite ? item.unite : "";
            let nomSafe = String(item.nom).replace(/'/g, "\\'").replace(/"/g, '&quot;');
            html += `
              <li class="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors w-full">
                <div class="flex-grow pr-2 min-w-0">
                  <span class="font-bold text-slate-800 dark:text-slate-200 text-sm break-words">${item.nom}</span>
                  <span class="text-blue-600 font-semibold ml-1 text-sm whitespace-nowrap">${qteAffichee} ${uniteAffichee}</span>
                </div>
                <button type="button" class="delete min-w-[36px] min-h-[36px] w-9 flex items-center justify-center bg-red-100 text-red-600 rounded-lg active:scale-90 transition-all text-sm" onclick="supprimerIngredientListe(this, '${nomSafe}')">🗑️</button>
              </li>`;
          });

          html += `</ul></div>`;
        }

        conteneur.innerHTML = html;
      }

      function supprimerIngredientListe(btn, nomIngredient) {
        listeCoursesBrute = listeCoursesBrute.filter(i => i.nom !== nomIngredient);
        afficherListeCourseTriee();
      }

      function ajouterIngredient() {
        let input = document.getElementById('ajout_manuel');
        let selectRayon = document.getElementById('ajout_manuel_rayon');
        let valeur = input.value.trim();
        let rayon = selectRayon ? selectRayon.value : "";
        if(valeur !== "") {
          listeCoursesBrute.push({ nom: valeur, quantite: "", unite: "", rayonForce: rayon });
          afficherListeCourseTriee();
          input.value = "";
          if(selectRayon) selectRayon.value = "";
        }
      }

      function partage(type) {
        let dateInput = document.getElementById('date_debut_menu').value;
        let dateFormatee = dateInput ? formaterDateLitterale(new Date(dateInput)) : "la semaine";

        let txt = "";

        if (type === 'Menu') {
          txt = `🍽️ MENUS POUR LA SEMAINE DU ${dateFormatee.toUpperCase()} :\n\n`;
          plan.forEach(p => {
            let titreFormate = (p.nom && p.nom !== "Repas non défini") ? p.nom : "Repas";
            txt += `🗓️ ${titreFormate}\n👉 ${p.recette} (${p.couverts} parts)\n\n`;
          });
        } else {
          txt = `🛒 LISTE DE COURSES POUR LA SEMAINE DU ${dateFormatee.toUpperCase()} :\n\n`;
          let groupes = {};
          listeCoursesBrute.forEach(item => {
            let rayon = item.rayonForce || determinerRayon(item.nom);
            if (!groupes[rayon]) groupes[rayon] = [];
            groupes[rayon].push(item);
          });

          for (let [rayon, items] of Object.entries(groupes)) {
            txt += `--- ${rayon.toUpperCase()} ---\n`;
            items.forEach(item => {
              let qte = item.quantite ? ` (${item.quantite} ${item.unite})` : '';
              txt += `- ${item.nom}${qte}\n`;
            });
            txt += `\n`;
          }
        }

        if (navigator.share) {
          navigator.share({ title: "Chef Perso", text: txt });
        } else {
          navigator.clipboard.writeText(txt).then(() => alert("Copié dans le presse-papier !"));
        }
      }

      async function afficherDetails() {
        let r = document.getElementById('select_consult').value;
        let p = parseInt(document.getElementById('parts_consult_val').innerText) || 5;
        if(!r) return;

        localStorage.setItem('derniere_recette', r);
        localStorage.setItem('derniers_couverts', p);

        document.getElementById('details_recette').innerHTML = '<p class="p-4 text-center text-slate-500 dark:text-slate-400 font-bold animate-pulse text-sm">Calcul...</p>';

        try {
          const items = await apiGet('getDetailsRecette', { nomRecette: r, nbParts: p });
          if (!items || items.length === 0) return document.getElementById('details_recette').innerHTML = '<p class="p-4 text-center text-sm">Introuvable.</p>';
          let h = '<ul class="divide-y divide-slate-100">';
          items.forEach(it => h += `<li class="p-3 flex justify-between bg-white dark:bg-slate-800"><span class="font-bold text-slate-800 dark:text-slate-200 text-sm">${it.nom}</span><span class="text-emerald-600 font-semibold text-sm">${it.quantite > 0 ? it.quantite : ""} ${it.unite}</span></li>`);
          document.getElementById('details_recette').innerHTML = h + '</ul>';
        } catch(e) {
          document.getElementById('details_recette').innerHTML = '<p class="p-4 text-center text-red-500 text-sm">Erreur lors du chargement.</p>';
        }
      }

      function addIngRow() {
        let div = document.createElement('div');
        div.className = "flex gap-2 items-center bg-white p-2 rounded-2xl border border-orange-200";
        // Générer un ID unique pour le champ input pour pouvoir le retrouver
        let inputId = "ing_new_" + Math.random().toString(36).substr(2, 9);
        div.innerHTML = `<input type="text" id="${inputId}" placeholder="Ingrédient" list="datalist_articles" class="ing-nom flex-grow h-10 border-b border-slate-100 dark:border-slate-700 outline-none text-sm px-1" onchange="verifierIngredientExistant(this)"><input type="text" placeholder="Qté" class="ing-qte w-20 h-10 border-b border-slate-100 dark:border-slate-700 outline-none text-sm text-center px-1"><button type="button" onclick="this.parentElement.remove()" class="min-w-[40px] h-10 text-red-500 font-bold">✕</button>`;
        document.getElementById('new_ingredients_list').appendChild(div);
      }

      function initThemeSelector() {
        let select = document.getElementById('select_theme');
        if (localStorage.theme === 'dark') {
          select.value = 'dark';
        } else if (localStorage.theme === 'light') {
          select.value = 'light';
        } else {
          select.value = 'system';
        }
      }

      function changerTheme() {
        let select = document.getElementById('select_theme');
        let val = select.value;
        if (val === 'dark') {
          localStorage.theme = 'dark';
          document.documentElement.classList.add('dark');
        } else if (val === 'light') {
          localStorage.theme = 'light';
          document.documentElement.classList.remove('dark');
        } else {
          localStorage.removeItem('theme');
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }

      document.addEventListener('DOMContentLoaded', initThemeSelector);

      async function sauverRecette() {
        let nom = document.getElementById('new_nom').value.trim();
        let ings = [];
        document.querySelectorAll('#new_ingredients_list > div').forEach(l => {
          let n = l.querySelector('.ing-nom').value.trim();
          if(n) ings.push({nom: n, qte: l.querySelector('.ing-qte').value.trim()});
        });
        if(!nom || ings.length === 0) return alert("⚠️ Nom et ingrédients requis.");

        let btn = document.getElementById('btn_save');
        btn.innerText = "⏳ Enregistrement..."; btn.disabled = true;

        try {
          const msg = await apiPost('enregistrerRecette', { nom, ingredients: ings });
          recs.push(nom); // update local optimiste
          localStorage.setItem('cache_recs', JSON.stringify(recs));
          alert(msg);
          location.reload();
        } catch(e) {
          alert("Erreur lors de l'enregistrement.");
          btn.innerText = "💾 Enregistrer la recette"; btn.disabled = false;
        }
      }

      function addEditIngRow(nom = "", qte = "") {
        let div = document.createElement('div');
        div.className = "flex gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-2xl border border-blue-200 dark:border-blue-800";
        let nomSafe = nom.replace(/"/g, '&quot;');
        let qteSafe = qte.replace(/"/g, '&quot;');
        let inputId = "ing_edit_" + Math.random().toString(36).substr(2, 9);
        div.innerHTML = `<input type="text" id="${inputId}" placeholder="Ingrédient" value="${nomSafe}" list="datalist_articles" class="ing-nom flex-grow h-10 border-b border-slate-100 dark:border-slate-700 outline-none text-sm px-1 bg-transparent text-slate-800 dark:text-slate-200" onchange="verifierIngredientExistant(this)"><input type="text" placeholder="Qté" value="${qteSafe}" class="ing-qte w-20 h-10 border-b border-slate-100 dark:border-slate-700 outline-none text-sm text-center px-1 bg-transparent text-slate-800 dark:text-slate-200"><button type="button" onclick="this.parentElement.remove()" class="min-w-[40px] h-10 text-red-500 font-bold">✕</button>`;
        document.getElementById('edit_ingredients_list').appendChild(div);
      }

      async function chargerRecetteEdition() {
        let nomRecette = document.getElementById('edit_recette_select').value;
        let zone = document.getElementById('edit_recette_zone');
        let list = document.getElementById('edit_ingredients_list');

        if (!nomRecette) {
          zone.classList.add('hidden');
          return;
        }

        zone.classList.remove('hidden');
        list.innerHTML = '<p class="text-sm text-slate-500 animate-pulse py-2">Chargement des ingrédients...</p>';
        document.getElementById('edit_recette_nom_original').value = nomRecette;
        document.getElementById('edit_recette_nom').value = nomRecette;
        document.getElementById('btn_update_recette').disabled = true;

        try {
          const items = await apiGet('getDetailsRecette', { nomRecette: nomRecette, nbParts: 1 });
          list.innerHTML = '';
          if (items && items.length > 0) {
            items.forEach(it => {
              let qte = it.quantite ? (it.unite ? `${it.quantite} ${it.unite}` : it.quantite) : "";
              addEditIngRow(it.nom, String(qte));
            });
          } else {
            addEditIngRow(); // Ajoute une ligne vide
          }
        } catch(e) {
          list.innerHTML = '<p class="text-sm text-red-500">Erreur lors du chargement.</p>';
        } finally {
          document.getElementById('btn_update_recette').disabled = false;
        }
      }



      function mettreAJourSelectRayonsGlobal() {
        let optionsRayons = listeRayonsActuelle.map(r => `<option value="${r}">${r}</option>`).join('');

        let selectAjoutManuel = document.getElementById('ajout_manuel_rayon');
        if (selectAjoutManuel) {
          selectAjoutManuel.innerHTML = '<option value="">🛒 Détecter Auto.</option>' + optionsRayons;
        }
        let adminNouvIngRayon = document.getElementById('admin_nouvel_article_rayon');
        if (adminNouvIngRayon) {
          adminNouvIngRayon.innerHTML = optionsRayons;
        }

        let container = document.getElementById('liste_rayons_editables');
        if (container) {
          let html = '';
          listeRayonsActuelle.forEach(r => {
             let rSafe = r.replace(/'/g, "\\'").replace(/"/g, '&quot;');
             html += `
             <div class="flex items-center gap-2">
               <input type="text" value="${rSafe}" onchange="renommerRayon('${rSafe}', this.value)" class="flex-grow h-10 border-b border-slate-100 dark:border-slate-700 outline-none px-2 text-sm bg-transparent text-slate-800 dark:text-slate-200">
               <button type="button" onclick="supprimerRayon('${rSafe}')" class="min-w-[40px] h-10 text-red-500 font-bold">✕</button>
             </div>`;
          });
          container.innerHTML = html;
        }
      }

      function renommerRayon(ancienNom, nouveauNomStr) {
         let nouveauNom = nouveauNomStr.trim();
         if(!nouveauNom || nouveauNom === ancienNom) return;
         if(listeRayonsActuelle.includes(nouveauNom)) {
            alert("Ce rayon existe déjà.");
            mettreAJourSelectRayonsGlobal();
            return;
         }

         let idx = listeRayonsActuelle.indexOf(ancienNom);
         if(idx > -1) {
            listeRayonsActuelle[idx] = nouveauNom;
            for(let key in mappingRayons) {
               if(mappingRayons[key] === ancienNom) {
                  mappingRayons[key] = nouveauNom;
               }
            }
            mettreAJourSelectRayonsGlobal();
            afficherRayonsArticles(mappingRayons);
         }
      }

      function supprimerRayon(nomRayon) {
         if(!confirm(`Supprimer le rayon "${nomRayon}" ?`)) return;

         listeRayonsActuelle = listeRayonsActuelle.filter(r => r !== nomRayon);
         for(let key in mappingRayons) {
            if(mappingRayons[key] === nomRayon) {
               mappingRayons[key] = "🛒 Rayon Divers / Épicerie"; // fallback
            }
         }
         if(!listeRayonsActuelle.includes("🛒 Rayon Divers / Épicerie")) {
            listeRayonsActuelle.push("🛒 Rayon Divers / Épicerie");
         }

         mettreAJourSelectRayonsGlobal();
         afficherRayonsArticles(mappingRayons);
      }

      function ajouterNouveauRayonLocal() {
        let nomInput = document.getElementById('nouveau_rayon_nom');
        let nvRayon = nomInput.value.trim();
        if (!nvRayon) return alert("Veuillez saisir un nom de rayon.");
        if (listeRayonsActuelle.includes(nvRayon)) return alert("Ce rayon existe déjà.");

        listeRayonsActuelle.push(nvRayon);
        nomInput.value = "";

        mettreAJourSelectRayonsGlobal();
        afficherRayonsArticles(mappingRayons);
        alert(`Rayon "${nvRayon}" ajouté ! N'oubliez pas de le sauvegarder (via le bouton Sauvegarder) pour le conserver pour la prochaine fois.`);
      }

      function ajouterArticleManuelRayons() {
        let nomInput = document.getElementById('admin_nouvel_article_nom');
        let nvIng = nomInput.value.trim();
        let nvRayon = document.getElementById('admin_nouvel_article_rayon').value;

        if (!nvIng) return alert("Veuillez saisir un nom d'ingrédient.");

        mappingRayons[nvIng] = nvRayon;
        nomInput.value = "";

        afficherRayonsArticles(mappingRayons);
        alert(`Article "${nvIng}" ajouté au rayon "${nvRayon}" ! N'oubliez pas de sauvegarder.`);
      }

      async function chargerRayonsAdmin() {
        document.getElementById('recherche_rayon_article').value = '';
        afficherRayonsArticles(mappingRayons);
      }

      function afficherRayonsArticles(objMapping) {
        let box = document.getElementById('admin_rayons_list');
        let html = '';

        let ingredients = getTousLesIngredients();

        if (ingredients.length === 0) {
           box.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">Aucun ingrédient trouvé. Calculez un menu pour que les ingrédients soient enregistrés.</p>';
           return;
        }

        let optionsRayons = listeRayonsActuelle.map(r => `<option value="${r}">${r}</option>`).join('');

        ingredients.forEach(ing => {
            let valActuelle = determinerRayon(ing);
            // On preselectionne l'option
            let opts = optionsRayons.replace(`value="${valActuelle}"`, `value="${valActuelle}" selected`);
            let id = "rayon_ing_" + ing.replace(/[^a-zA-Z0-9]/g, "_");

            html += `
            <div class="rayon-ing-row flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm gap-2" data-nom="${ing}">
               <span class="text-sm font-bold text-slate-800 dark:text-slate-200 flex-grow min-w-0 break-words">${ing}</span>
               <select class="rayon-ing-select h-10 border border-slate-200 dark:border-slate-700 rounded-xl px-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0 max-w-[150px]">
                  ${opts}
               </select>
            </div>
            `;
        });

        box.innerHTML = html;
      }

      function filtrerRayonsArticles() {
        let terme = document.getElementById('recherche_rayon_article').value.toLowerCase();
        document.querySelectorAll('.rayon-ing-row').forEach(row => {
          let nom = row.getAttribute('data-nom').toLowerCase();
          if (nom.includes(terme)) {
            row.style.display = 'flex';
          } else {
            row.style.display = 'none';
          }
        });
      }

      async function sauvegarderTousLesRayons() {
        let nouveauMapping = {};
        document.querySelectorAll('.rayon-ing-row').forEach(row => {
           let nom = row.getAttribute('data-nom');
           let rayon = row.querySelector('.rayon-ing-select').value;
           nouveauMapping[nom] = rayon;
        });

        let btn = document.getElementById('btn_save_rayons');
        btn.innerText = "⏳ Sauvegarde...";
        btn.disabled = true;

        mappingRayons = nouveauMapping;
        localStorage.setItem('cache_mappingRayons', JSON.stringify(mappingRayons));

        try {
          const msg = await apiPost('sauvegarderRayons', { mapping: nouveauMapping });
          alert(msg || "Rayons sauvegardés avec succès !");
        } catch(e) {
          alert("Erreur lors de la sauvegarde.");
        } finally {
          btn.innerText = "💾 Sauvegarder les rayons";
          btn.disabled = false;
        }
      }

      async function mettreAJourRecette() {
        let nomOriginal = document.getElementById('edit_recette_nom_original').value;
        let nouveauNom = document.getElementById('edit_recette_nom').value.trim();
        let ings = [];

        document.querySelectorAll('#edit_ingredients_list > div').forEach(l => {
          let n = l.querySelector('.ing-nom').value.trim();
          if(n) ings.push({nom: n, qte: l.querySelector('.ing-qte').value.trim()});
        });

        if(!nouveauNom || ings.length === 0) return alert("⚠️ Nom et ingrédients requis.");

        let btn = document.getElementById('btn_update_recette');
        btn.innerText = "⏳ Sauvegarde...";
        btn.disabled = true;

        try {
          const msg = await apiPost('modifierRecette', { nomOriginal: nomOriginal, nouveauNom: nouveauNom, ingredients: ings });
          if(nomOriginal !== nouveauNom) {
             let idx = recs.indexOf(nomOriginal);
             if(idx > -1) recs[idx] = nouveauNom;
             localStorage.setItem('cache_recs', JSON.stringify(recs));
          }
          alert(msg || "Recette mise à jour avec succès !");
          location.reload();
        } catch(e) {
          alert("Erreur lors de la mise à jour.");
          btn.innerText = "💾 Sauvegarder les modifications";
          btn.disabled = false;
        }
      }
