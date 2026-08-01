import re
with open('wajib-form.html', 'r', encoding='utf-8') as f:
    html = f.read()

m = re.search(r'<div class="hdr">(.*?)</div>\s*<div class="ttl">', html, re.DOTALL)
if m:
    hdr = m.group(1)
    hdr = re.sub(r'src="data:image/jpeg;base64,[^"]+"', 'src="...base64..."', hdr)
    with open('hdr_out.txt', 'w', encoding='utf-8') as fout:
        fout.write(hdr)
else:
    with open('hdr_out.txt', 'w', encoding='utf-8') as fout:
        fout.write('Not found')
