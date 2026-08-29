import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the leftover from sauvegarderToutesSuggestions
content = re.sub(r'btn\.innerText = "💾 Sauvegarder les rayons";\s*btn\.disabled = false;\s*\}\s*\}\s*\}\);\s*let btn = document\.getElementById\(\'btn_save_suggestions\'\);[\s\S]*?btn\.disabled = false;\s*\}\s*\}', r'btn.innerText = "💾 Sauvegarder les rayons";\n          btn.disabled = false;\n        }\n      }', content)


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
