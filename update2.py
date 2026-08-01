import re

with open("wajib-form.html", "r", encoding="utf-8") as f:
    html = f.read()

# Change border color for th,td to a gray tone
html = re.sub(r'border:1\.5px solid #4a7ab5', 'border:1.5px solid #888888', html)

# Change .mh th background (main headers)
html = html.replace('#5b8ec7', '#6c757d')

# Change .sh th background (sub headers)
html = html.replace('#a8c8e8', '#d3d3d3')

# Change text color in sub headers from dark blue to dark gray, if they have color:#1a3a5c
html = re.sub(r'color:#1a3a5c(.*?)(من الساعة|الى الساعة)', r'color:#333333\1\2', html)

with open("wajib-form.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Headers updated to gray.")
