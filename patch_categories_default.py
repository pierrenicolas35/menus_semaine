import re
import json
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
sugg_match = re.search(r'const SUGGESTIONS_PAR_DEFAUT = \[(.*?)\];', content, re.DOTALL)
if sugg_match:
    sugg_str = sugg_match.group(1)
    categories = []
    all_items = []
    for obj_match in re.finditer(r'\{\s*categorie:\s*"([^"]+)",\s*items:\s*\[(.*?)\]\s*\}', sugg_str):
        cat = obj_match.group(1)
        items_str = obj_match.group(2)
        items = [i.strip(' "') for i in items_str.split(',') if i.strip()]
        categories.append(cat)
        all_items.extend(items)
    ingred_match = re.search(r'(const INGREDIENTS_DE_BASE = \[)(.*?)(\];)', content, re.DOTALL)
    if ingred_match:
        old_items = ingred_match.group(2).strip()
        new_items_str = ', '.join([f'"{i}"' for i in all_items])
        if old_items.endswith(','):
            new_items_str = old_items + ' ' + new_items_str
        else:
            new_items_str = old_items + ', ' + new_items_str
        content = content.replace(ingred_match.group(0), ingred_match.group(1) + new_items_str + ingred_match.group(3))
    content = content.replace(sugg_match.group(0), '')
    content = re.sub(r'function mergeCategoriesSuggestions\(\) \{[\s\S]*?^\s*\}', '', content, flags=re.MULTILINE)
    pattern_getTous = r'SUGGESTIONS_PAR_DEFAUT\.forEach\(cat => \{[\s\S]*?\}\);'
    content = re.sub(pattern_getTous, '', content)
    pattern_suggPerso = r'if \(Array\.isArray\(suggestionsPersonnalisees\)\) \{[\s\S]*?\}\s*\}'
    content = re.sub(pattern_suggPerso, '', content)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
