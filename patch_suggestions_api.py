import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(
    r'apiGet\(\'getMenusSauvegardes\'\)\.catch\(\(\) => null\),\s*apiGet\(\'getSuggestions\'\)\.catch\(\(\) => null\)',
    r"apiGet('getMenusSauvegardes').catch(() => null)",
    content
)
content = re.sub(
    r'let \[nouveauxRayons, nouvellesRecettes, nouveauxMenus, nouvellesSuggestions\] = await Promise\.all\(\[',
    r'let [nouveauxRayons, nouvellesRecettes, nouveauxMenus] = await Promise.all([',
    content
)
pattern_update_sugg = r'if \(nouvellesSuggestions && [\s\S]*?hasUpdates = true;\s*\}'
content = re.sub(pattern_update_sugg, '', content)
content = re.sub(r'let suggestionsPersonnalisees = \[\];\n', '', content)
pattern_start_sugg = r'let cacheSuggestions = localStorage\.getItem\(\'cache_suggestionsPersonnalisees\'\);\n\s*if \(cacheSuggestions\) suggestionsPersonnalisees = JSON\.parse\(cacheSuggestions\);'
content = re.sub(pattern_start_sugg, '', content)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
