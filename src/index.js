const fs = require('fs');
const { join } = require('path');
const generateThemes = require('./generate-themes.js');

function nameToTheme(name) {
  return name.toLowerCase().replace(/ /g, '_');
}

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

const themes = fs
  .readFileSync(join(__dirname, 'themes', 'ace.txt'))
  .toString()
  .split('\n')
  .reduce((obj, name) => ({
    ...obj,
    [nameToTheme(name)]: [name, false],
  }), {});

fs.readdirSync(join(__dirname, 'themes'))
  .filter(file => file.endsWith('.tmTheme'))
  .map(file => file.replace(/\.tmTheme$/, ''))
  .forEach((name) => {
    themes[nameToTheme(name)] = [name, true];
  });

fs.writeFileSync('./dist/index.json', JSON.stringify(themes, null, 2));

generateThemes();
