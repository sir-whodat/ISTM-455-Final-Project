const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { createApp } = require('./app');

function loadPemOptions(pemPath) {
  const pemContent = fs.readFileSync(pemPath, 'utf8');
  const keyMatch = pemContent.match(/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z ]+ )?PRIVATE KEY-----/);
  const certMatch = pemContent.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);

  if (!keyMatch || !certMatch) {
    throw new Error(`Unable to read private key and certificate from ${pemPath}`);
  }

  return {
    key: keyMatch[0],
    cert: certMatch[0]
  };
}

function startServer() {
  const port = Number(process.env.PORT || 8443);
  const pemPath = process.env.SSL_PEM_PATH || path.join(__dirname, '..', 'certs', 'server.pem');

  let tlsOptions;
  try {
    tlsOptions = loadPemOptions(pemPath);
  } catch (error) {
    console.error(`Error: could not load TLS certificate from ${pemPath}`);
    console.error('Run "npm run cert:generate" to create a self-signed certificate, then retry.');
    process.exit(1);
  }

  const { app } = createApp();

  const server = https.createServer(tlsOptions, app);

  server.listen(port, () => {
    console.log(`Contacts book API listening on https://localhost:${port}`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  loadPemOptions,
  startServer
};