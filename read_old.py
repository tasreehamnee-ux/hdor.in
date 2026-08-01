import sys

with open('old_wajib.html', 'rb') as f:
    b = f.read()

try:
    text = b.decode('utf-16')
except Exception as e:
    text = b.decode('utf-8', errors='ignore')

# Search for "الوحدة:"
idx = text.find("الوحدة:")
if idx != -1:
    sys.stdout.buffer.write(text[idx-200:idx+200].encode('utf-8'))
else:
    sys.stdout.buffer.write(b"Arabic text not found\n")
