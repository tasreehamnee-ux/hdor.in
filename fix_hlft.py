with open("wajib-form.html", "r", encoding="utf-8") as f:
    content = f.read()

import re

new_hlft_css = """.hlft{display:flex;flex-direction:column;gap:16px;justify-content:center;padding-left:10px}
.fr{font-size:16px;font-weight:700;display:flex;align-items:flex-end;gap:8px;width:100%}
.fr label{white-space:nowrap;color:#1a3a5c;min-width:60px;text-align:right}
.fl{display:inline-block;flex:1;border-bottom:1.5px solid #1a3a5c;height:18px}"""

content = re.sub(r'\.hlft\{[^}]+\}\s*\.fr\{[^}]+\}\s*\.fr label\{[^}]+\}\s*\.fl\{[^}]+\}', new_hlft_css, content)

with open("wajib-form.html", "w", encoding="utf-8") as f:
    f.write(content)

print("hlft CSS updated successfully!")
