with open("wajib-form.html", "r", encoding="utf-8") as f:
    content = f.read()

old_css = """.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:3px solid #1a3a5c;padding-bottom:12px}
.hright{text-align:right;flex:1;width:33.33%}
.mn{font-size:19px;font-weight:900;color:#1a3a5c;margin-bottom:5px}
.of{font-size:16px;font-weight:700;color:#333;margin-bottom:4px}
.dp{font-size:15px;font-weight:700;color:#1a3a5c}
.hc{display:flex;align-items:center;justify-content:center;flex:1;width:33.33%}
.hc img{width:110px;height:110px;object-fit:contain}
.hlft{flex:1;display:flex;flex-direction:column;gap:14px;width:33.33%}"""

new_css = """.hdr{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;margin-bottom:15px;border-bottom:3px solid #1a3a5c;padding-bottom:12px}
.hright{text-align:right}
.mn{font-size:19px;font-weight:900;color:#1a3a5c;margin-bottom:5px}
.of{font-size:16px;font-weight:700;color:#333;margin-bottom:4px}
.dp{font-size:15px;font-weight:700;color:#1a3a5c}
.hc{display:flex;align-items:center;justify-content:center}
.hc img{width:120px;height:120px;object-fit:contain}
.hlft{display:flex;flex-direction:column;gap:14px}"""

if old_css in content:
    content = content.replace(old_css, new_css)
    with open("wajib-form.html", "w", encoding="utf-8") as f:
        f.write(content)
    print("CSS successfully updated!")
else:
    print("Old CSS block not found exact match, checking line by line...")
    import re
    content = re.sub(r'\.hdr\{[^}]+\}', '.hdr{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;margin-bottom:15px;border-bottom:3px solid #1a3a5c;padding-bottom:12px}', content)
    content = re.sub(r'\.hright\{[^}]+\}', '.hright{text-align:right}', content)
    content = re.sub(r'\.hc\{[^}]+\}', '.hc{display:flex;align-items:center;justify-content:center}', content)
    content = re.sub(r'\.hc img\{[^}]+\}', '.hc img{width:120px;height:120px;object-fit:contain}', content)
    content = re.sub(r'\.hlft\{[^}]+\}', '.hlft{display:flex;flex-direction:column;gap:14px}', content)
    with open("wajib-form.html", "w", encoding="utf-8") as f:
        f.write(content)
    print("Regex replacement completed!")
