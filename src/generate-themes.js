const fs = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

const CleanCSS = require('clean-css');

const cleanCSS = new CleanCSS();

const ACE_REPO = 'https://github.com/ajaxorg/ace.git';
const ACE_TAG = 'v1.4.8';
const ACE_DIR = join(__dirname, 'ace');

const THEMES_DIR = join(__dirname, 'themes');
const OUT_DIR = join(__dirname, '..', 'dist');

function run(cmd, stdio = true) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: stdio ? 'inherit' : undefined });
}

function normalize(name) {
  return name.toLowerCase().replace(/ /g, '_');
}

function transformTheme(name) {
  const jsFile = join(OUT_DIR, `${name}.js`);
  const js = fs.readFileSync(jsFile).toString();
  fs.unlinkSync(jsFile);

  const cssFile = join(OUT_DIR, `${name}.css`);
  const css = fs.readFileSync(cssFile).toString();
  const minifiedCss = cleanCSS.minify(css).styles;
  fs.unlinkSync(cssFile);

  const define = js
    .replace(/\/\*.+\*\//s, '')
    .replace(/define\(/, `ace.define('ace/theme/${name}', ['require', 'exports', 'module', 'ace/lib/dom'], `)
    .replace(/require\(.+requirejs.+\)/, `\`${minifiedCss}\``);

  const updatedJs = `${define}
    (() => {
      ace.require(['ace/theme/${name}'], (m) => {
        if (typeof module === 'object' && typeof exports === 'object' && module) {
          module.exports = m;
        }
      });
    })();
  `;

  fs.writeFileSync(jsFile, updatedJs);
}

module.exports = () => {
  if (!fs.existsSync(ACE_DIR)) {
    run(`git clone ${ACE_REPO} --branch ${ACE_TAG} --depth 1 ${ACE_DIR}`);
  }

  run(`npm i --prefix ${ACE_DIR}/tool`);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
  }

  fs.readdirSync(THEMES_DIR)
    .filter(file => file.endsWith('.tmTheme'))
    .forEach((file) => {
      const name = normalize(file.replace(/\.tmTheme$/, ''));
      console.log(`> Generating ${name}`);

      run(`node ${ACE_DIR}/tool/tmtheme.js "${name}" "${join(THEMES_DIR, file)}" "${OUT_DIR}"`, false);
      transformTheme(name);
    });
};
