// Usage: set MOCK_VIEW_PASSWORD, then node scripts/build-preview.cjs
// GitHub Pages receives only docs/. Source index.html remains local-development friendly.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const password = process.env.MOCK_VIEW_PASSWORD;
if (!password) throw new Error('MOCK_VIEW_PASSWORD is required. No unprotected build is produced.');
const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
const iterations = 210000;
const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(fs.readFileSync(path.join(root, 'index.html'))), cipher.final(), cipher.getAuthTag()]);
const payload = {salt:salt.toString('base64'),iv:iv.toString('base64'),data:encrypted.toString('base64'),iterations};
const template = fs.readFileSync(path.join(__dirname, 'preview-gate.html'), 'utf8');
fs.mkdirSync(path.join(root, 'docs'), {recursive:true});
fs.writeFileSync(path.join(root, 'docs/index.html'), template.replace('__PREVIEW_PAYLOAD__', JSON.stringify(payload)));
fs.writeFileSync(path.join(root, 'docs/.nojekyll'), '');
fs.writeFileSync(path.join(root, 'docs/robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log('Password-protected preview built in docs/.');
