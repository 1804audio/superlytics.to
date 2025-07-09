/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
// Chalk v5 is ES modules only, use simple colors
const chalk = {
  yellowBright: text => `\x1b[93m${text}\x1b[0m`,
  redBright: text => `\x1b[91m${text}\x1b[0m`,
  greenBright: text => `\x1b[92m${text}\x1b[0m`,
};
const messages = require('../src/lang/en-US.json');
const ignore = require('../lang-ignore.json');

const dir = path.resolve(__dirname, '../lang');
const files = fs.readdirSync(dir);
const keys = Object.keys(messages).sort();
const filter = process.argv?.[2];

files.forEach(file => {
  if (file !== 'en-US.json') {
    const lang = require(`../lang/${file}`);
    const id = file.replace('.json', '');

    if (filter && filter !== id) {
      return;
    }

    console.log(chalk.yellowBright(`\n## ${file.replace('.json', '')}`));
    let count = 0;
    keys.forEach(key => {
      const orig = messages[key];
      const check = lang[key];
      const ignored = ignore[id] === '*' || ignore[id]?.includes(key);

      if (!ignored && (!check || check === orig)) {
        console.log(chalk.redBright('*'), chalk.greenBright(`${key}:`), orig);
        count++;
      }
    });

    if (count === 0) {
      console.log('**Complete!**');
    }
  }
});
