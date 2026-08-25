import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add data-cat in the modale_suggestions HTML generation
# Let's check how modale_suggestions HTML is generated
search_suggestions = """<input type="checkbox" id="${idUnique}" class="chk-sug-item w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 shrink-0" data-nom="${itemSafe}" data-cat="${catGroup.categorie}">"""
# Oh, it already has data-cat="${catGroup.categorie}" ! Wait, let me check the file content.
