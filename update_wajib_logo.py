import base64
import re

with open("image.jpeg", "rb") as f:
    img_bytes = f.read()

b64_str = base64.b64encode(img_bytes).decode('utf-8')
data_uri = f"data:image/jpeg;base64,{b64_str}"

with open("wajib-form.html", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'(<div class="hc">\s*<img src=")[^"]+(")'
new_content = re.sub(pattern, r'\g<1>' + data_uri + r'\g<2>', content)

with open("wajib-form.html", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully updated wajib-form.html logo!")
