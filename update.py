import re

with open("logo_b64.txt", "r", encoding="utf-8") as f:
    b64_logo = f.read().strip()

with open("wajib-form.html", "r", encoding="utf-8") as f:
    html = f.read()

# remove الشعبة
html = re.sub(r'<div class="fr"><label>الشعبة:</label><span class="fl"></span></div>\n?', '', html)

# replace logo
new_img = f'<img src="{b64_logo}" alt="شعار المتابعة">'
html = re.sub(r'<img src="data:image/png;base64,[^"]+" alt="[^"]*">', new_img, html)

with open("wajib-form.html", "w", encoding="utf-8") as f:
    f.write(html)

print("HTML updated successfully.")
