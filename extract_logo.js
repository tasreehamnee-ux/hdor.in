const fs = require("fs");
const orig = fs.readFileSync("\u062a\u0635\u0631\u064a\u062d. html.txt", "utf8");
const m = orig.match(/src="(data:image\/[^"]+)"/);
if(m){
  fs.writeFileSync("logo_b64.txt", m[1], "utf8");
  process.stdout.write("OK:" + m[1].length + "\n");
} else {
  process.stdout.write("NOT FOUND\n");
}
