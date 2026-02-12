const fs = require("fs");
const https = require("https");
const path = require("path");

const url = "https://agenda-deux-par-deux.github.io/bt1oh97j7X.bin";
const dest = path.resolve(__dirname, "../src/bt1oh97j7X.bin");

https.get(url, res => {
  if (res.statusCode !== 200) {
    console.error(`❌ Échec du téléchargement: ${res.statusCode}`);
    res.resume(); // drain
    process.exit(1);
  }

  const chunks = [];
  res.on("data", chunk => chunks.push(chunk)); // chunk est un Buffer
  res.on("end", () => {
    const buf = Buffer.concat(chunks);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf); // <-- pas d'encoding
    console.log(`✅ Fichier téléchargé (binaire) dans ${dest} — ${buf.length} bytes`);
    console.log("Header bytes:", buf[0], buf[1]); // doit être 31 139
  });
}).on("error", err => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
