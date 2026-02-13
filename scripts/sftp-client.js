// deploySftp.cjs
const fs = require("fs");
const path = require("path");
const SftpClient = require("ssh2-sftp-client");

/**
 * @param {object} cfg  JSON préloadé:
 *  {
 *    host, port, username,
 *    password? OR privateKeyPath?, passphrase?,
 *    remoteRoot: "/var/www/site"
 *  }
 * @param {{local:string, remote:string}[]} items
 *  Ex: { local: "dist", remote: "." }  -> contenu de dist vers remoteRoot/
 *      { local: "dist", remote: "dist" } -> dist/* vers remoteRoot/dist/*
 *      { local: "robots.txt", remote: "robots.txt" }
 * @param {{dryRun?:boolean, overwrite?:boolean}} [opts]
 */
async function deploySftp(cfg, items, opts = {}) {
  const dryRun = !!opts.dryRun;
  const overwrite = opts.overwrite !== false;

  if (!cfg?.host || !cfg?.username || !cfg?.remoteRoot) {
    throw new Error("Config invalide: host/username/remoteRoot requis.");
  }
  if (!Array.isArray(items)) {
    throw new Error("items doit être un array de { local, remote }.");
  }

  const sftp = new SftpClient();

  const connectOptions = {
    host: cfg.host,
    port: cfg.port ?? 22,
    username: cfg.username,
  };

  if (cfg.password) connectOptions.password = cfg.password;

  if (cfg.privateKeyPath) {
    connectOptions.privateKey = fs.readFileSync(path.resolve(cfg.privateKeyPath));
    if (cfg.passphrase) connectOptions.passphrase = cfg.passphrase;
  }

  const toPosix = (p) => String(p).replace(/\\/g, "/");
  const posixJoin = (...parts) =>
    parts.filter(Boolean).join("/").replace(/\\/g, "/").replace(/\/+/g, "/");

  function statSafe(p) {
    try {
      return fs.statSync(p);
    } catch {
      return null;
    }
  }

  async function ensureRemoteDir(remoteDir) {
    const parts = toPosix(remoteDir).split("/").filter(Boolean);
    let cur = remoteDir.startsWith("/") ? "/" : "";
    for (const part of parts) {
      cur = cur === "/" ? `/${part}` : `${cur}/${part}`;
      try {
        // eslint-disable-next-line no-await-in-loop
        await sftp.stat(cur);
      } catch {
        if (dryRun) continue;
        try {
          // eslint-disable-next-line no-await-in-loop
          await sftp.mkdir(cur);
        } catch {
          // ignore (exists / race)
        }
      }
    }
  }

  async function remoteExists(remotePath) {
    try {
      return !!(await sftp.exists(remotePath)); // 'd' | '-' | 'l' | false
    } catch {
      return false;
    }
  }

  async function putFile(localAbs, remoteAbs) {
    if (!overwrite) {
      const exists = await remoteExists(remoteAbs);
      if (exists) {
        console.log(`skip (exists) ${remoteAbs}`);
        return;
      }
    }

    await ensureRemoteDir(path.posix.dirname(remoteAbs));

    if (dryRun) {
      console.log(`[dry] put ${localAbs} -> ${remoteAbs}`);
      return;
    }

    await sftp.fastPut(localAbs, remoteAbs);
    console.log(`put ${remoteAbs}`);
  }

  async function putDir(localDirAbs, remoteDirAbs) {
    const entries = fs.readdirSync(localDirAbs, { withFileTypes: true });
    for (const ent of entries) {
      const childLocalAbs = path.join(localDirAbs, ent.name);
      const childRemoteAbs = posixJoin(remoteDirAbs, toPosix(ent.name));

      if (ent.isDirectory()) {
        await putDir(childLocalAbs, childRemoteAbs);
      } else if (ent.isFile()) {
        await putFile(childLocalAbs, childRemoteAbs);
      }
    }
  }

  console.log(`SFTP deploy => ${cfg.host}:${connectOptions.port} (dry=${dryRun}, overwrite=${overwrite})`);

  await sftp.connect(connectOptions);
  try {
    for (const it of items) {
      const local = it?.local;
      const remote = it?.remote;

      if (!local || remote === undefined || remote === null) {
        console.warn("skip (invalid item)", it);
        continue;
      }

      const localAbs = path.resolve(local);
      const st = statSafe(localAbs);
      if (!st) {
        console.warn(`skip (missing) ${local}`);
        continue;
      }

      // remote est relatif à remoteRoot
      // convention: remote="." => sync le contenu du dossier local vers remoteRoot (ou vers remoteRoot + ".")
      const remoteAbs = posixJoin(cfg.remoteRoot, toPosix(remote));
      const targetRemoteDir = (toPosix(remote) === ".") ? cfg.remoteRoot : remoteAbs;

      if (st.isDirectory()) {
        console.log(`dir  ${local} -> ${targetRemoteDir}`);
        await putDir(localAbs, targetRemoteDir);
      } else if (st.isFile()) {
        console.log(`file ${local} -> ${remoteAbs}`);
        await putFile(localAbs, remoteAbs);
      } else {
        console.warn(`skip (not file/dir) ${local}`);
      }
    }
  } finally {
    await sftp.end();
  }

  console.log("Done.");
}

module.exports = { deploySftp };
