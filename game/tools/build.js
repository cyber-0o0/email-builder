// Build: inlines CSS, JS and fonts into single-file HTML.
//   dist/index.html  -> full document for Yandex Games (zip the dist folder)
//   dist/artifact.html -> body-only variant for claude.ai artifact preview
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = (p) => fs.readFileSync(path.join(root, 'src', p), 'utf8');
const ORDER = ['core', 'sdk', 'audio', 'materials', 'targets', 'items', 'world', 'fx', 'render', 'game', 'ui', 'main'];

function fontsCSS() {
  const css = fs.readFileSync(path.join(__dirname, 'fonts', 'fonts.css'), 'utf8');
  const blocks = css.split('/* ').slice(1);
  let out = '';
  for (const b of blocks) {
    const subset = b.slice(0, b.indexOf(' */'));
    if (subset !== 'cyrillic' && subset !== 'latin') continue;
    const url = b.match(/url\((.*?)\)/)[1];
    const file = path.join(__dirname, 'fonts', path.basename(url));
    if (!fs.existsSync(file)) throw new Error('missing font file ' + file + ' (run tools/fetch-fonts.sh)');
    const data = fs.readFileSync(file).toString('base64');
    let face = b.slice(b.indexOf('@font-face')).trim();
    face = face.replace(/url\(.*?\)/, `url(data:font/woff2;base64,${data})`);
    out += face + '\n';
  }
  return out;
}

let html = src('index.html');
const css = src('style.css');
const js = ORDER.map((n) => `/* ---- ${n}.js ---- */\n` + src(`js/${n}.js`)).join('\n');
html = html.replace('/*CSS*/', () => fontsCSS() + css).replace('/*JS*/', () => js).replace('<!--FONTS-->', '');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const full = html.replace(/<!--(HEAD|BODY|TAIL)_(START|END)-->/g, '');
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full);
const art = html.replace(/<!--HEAD_START-->[\s\S]*?<!--HEAD_END-->/, '').replace(/<!--BODY_START-->[\s\S]*?<!--BODY_END-->/, '').replace(/<!--TAIL_START-->[\s\S]*?<!--TAIL_END-->/, '');
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), art);
console.log('built', (full.length / 1024).toFixed(0) + 'KB');
