# Etape 1 : Vocabulaire
sed -i 's/Gérer les rayons/Gérer les articles et rayons/g' index.html
sed -i 's/Associer un rayon par ingrédient/Associer un rayon par article/g' index.html
sed -i 's/Associez chaque ingrédient de vos recettes/Associez chaque article ou ingrédient/g' index.html
sed -i 's/datalist_ingredients/datalist_articles/g' index.html
sed -i 's/mettreAJourDatalistIngredients/mettreAJourDatalistArticles/g' index.html
sed -i 's/recherche_rayon_ing/recherche_rayon_article/g' index.html
sed -i 's/filtrerRayonsIngredients/filtrerRayonsArticles/g' index.html
sed -i 's/afficherRayonsIngredients/afficherRayonsArticles/g' index.html
sed -i 's/Rechercher un ingrédient/Rechercher un article/g' index.html
sed -i 's/admin_nouvel_ing_nom/admin_nouvel_article_nom/g' index.html
sed -i 's/admin_nouvel_ing_rayon/admin_nouvel_article_rayon/g' index.html
sed -i 's/ajouterIngredientManuelRayons/ajouterArticleManuelRayons/g' index.html
sed -i 's/Nouvel ingrédient/Nouvel article/g' index.html
sed -i "s/L'ingrédient/L'article/g" index.html
sed -i 's/Ingrédient "/Article "/g' index.html
sed -i 's/placeholder="Nom de l'\''ingrédient..."/placeholder="Nom de l'\''article..."/g' index.html
sed -i 's/Ajouter un ingrédient manuellement :/Ajouter un article manuellement :/g' index.html

# Etape 2 : Patches
python3 patch_suggestions.py
python3 patch_suggestions_api.py
python3 patch_categories_default.py
python3 patch_ouvrir_modale.py
python3 patch_select_modale.py
python3 clean_leftovers.py
python3 fix_syntax.py
python3 fix_get_ingredients.py
python3 fix_charger_sugg.py
python3 fix_charger_recette.py
