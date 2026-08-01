import re
with open('wajib-form.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.rfind('hlft')
with open('hlft_out.txt', 'w', encoding='utf-8') as fout:
    fout.write(html[idx-100:idx+50])
