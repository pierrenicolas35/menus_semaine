import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
pattern = r'async function chargerSuggestionsPerso\(\) \{[\s\S]*?\}\n\n'
content = re.sub(pattern, '', content)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
