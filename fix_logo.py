import re

# Read base64 logo
with open('new_logo_b64.txt', 'r', encoding='utf-8') as f:
    logo_data = f.read().strip()

# Read HTML file
with open('wajib-form.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Replace the broken src
pattern = r'<img src="data:image/jpeg;base64,/9j/[^"]+" alt="شعار" style="width:110px;height:110px;object-fit:contain">'
replacement = f'<img src="{logo_data}" alt="شعار" style="width:110px;height:110px;object-fit:contain">'

new_html = re.sub(pattern, replacement, html_content)

# Write back to wajib-form.html
with open('wajib-form.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Replacement successful")
