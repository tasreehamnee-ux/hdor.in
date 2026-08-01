import base64

with open("wajib-form.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
m = re.search(r'<img [^>]*src="([^"]+)"', html)
if m:
    current_src = m.group(1)
else:
    current_src = ""

b_logo = open("logo_b64.txt", "r", encoding="utf-8").read().strip() if open("logo_b64.txt") else ""
b_new_logo = open("new_logo_b64.txt", "r", encoding="utf-8").read().strip() if open("new_logo_b64.txt") else ""
b_img_jpeg = base64.b64encode(open("image.jpeg", "rb").read()).decode("utf-8")

print("Is current_src == logo_b64?", "data:image/jpeg;base64," + b_logo in current_src)
print("Is current_src == new_logo_b64?", "data:image/jpeg;base64," + b_new_logo in current_src or b_new_logo in current_src)
print("Is current_src == image.jpeg?", "data:image/jpeg;base64," + b_img_jpeg in current_src)
