with open("wajib-form.html", "r", encoding="utf-8") as f:
    html = f.read()

import re
m = re.search(r'<img [^>]*src="([^"]+)"', html)
if m:
    src = m.group(1)
    print("SRC starts with:", src[:60])
    print("SRC length:", len(src))
