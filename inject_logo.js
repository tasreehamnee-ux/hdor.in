const fs = require("fs");
const logo = fs.readFileSync("logo_b64.txt", "utf8").trim();
const wajib = fs.readFileSync("wajib-form.html", "utf8");
const updated = wajib.replace(
  /<img src="image\.jpeg" alt="[^"]*">/,
  '<img src="' + logo + '" alt="شعار وزارة الشباب والرياضة">'
);
fs.writeFileSync("wajib-form.html", updated, "utf8");
process.stdout.write("DONE - size:" + fs.statSync("wajib-form.html").size + "\n");
