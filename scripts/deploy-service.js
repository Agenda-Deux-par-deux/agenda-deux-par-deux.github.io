const fs = require("fs");
const path = require("path");
const { deploySftp } = require("./sftp-client");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "deploy-service.json"), "utf8"));

const items = [{ local: "dist/service", remote: "." }];

deploySftp(cfg, items, { dryRun: false, overwrite: true })
  .catch(console.error);
