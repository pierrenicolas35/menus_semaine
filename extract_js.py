import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()
matches = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
js = '\n'.join(matches)
with open('temp.js', 'w', encoding='utf-8') as f:
    f.write(js)
