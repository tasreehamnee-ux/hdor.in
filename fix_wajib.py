with open("wajib-form.html", "r", encoding="utf-8") as f:
    html = f.read()

# Check if '"hlft">' is in the HTML
if '"hlft">' in html:
    print("Found '\"hlft\">', fixing...")
    # Replace '"hlft">' with '" alt="logo">\n    </div>\n    <div class="hlft">'
    fixed_html = html.replace('"hlft">', '" alt="logo">\n    </div>\n    <div class="hlft">')
    with open("wajib-form.html", "w", encoding="utf-8") as f:
        f.write(fixed_html)
    print("wajib-form.html header has been fixed successfully!")
else:
    print("'\"hlft\">' not found in wajib-form.html. It might have been fixed or has a different format.")
