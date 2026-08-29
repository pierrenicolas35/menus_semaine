import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern_bouton_sugg = r'<button type="button" onclick="changerVue\(\'vue_gerer_suggestions\'\)"[\s\S]*?</button>'
content = re.sub(pattern_bouton_sugg, '', content)

pattern_div_sugg = r'<!-- GERER LES SUGGESTIONS -->[\s\S]*?<!-- GERER LES RAYONS -->'
content = re.sub(pattern_div_sugg, '<!-- GERER LES RAYONS -->', content)

pattern_charger = r'async function chargerSuggestionsAdmin\(\) \{[\s\S]*?^\s*\}'
content = re.sub(pattern_charger, '', content, flags=re.MULTILINE)

pattern_ajouter = r'function ajouterSuggestionAdmin\(\) \{[\s\S]*?^\s*\}'
content = re.sub(pattern_ajouter, '', content, flags=re.MULTILINE)

pattern_sauver = r'async function sauvegarderToutesSuggestions\(\) \{[\s\S]*?^\s*\}'
content = re.sub(pattern_sauver, '', content, flags=re.MULTILINE)

content = re.sub(r'if \(vueSauvegardee === \'vue_gerer_suggestions\'\) \{[\s\S]*?\}', '', content)
content = re.sub(r'if \(vueActuelle === \'vue_gerer_suggestions\'\) chargerSuggestionsAdmin\(\);', '', content)
content = re.sub(r'if\(id === \'vue_gerer_suggestions\'\) \{[\s\S]*?\}', '', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
