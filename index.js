#!/usr/bin/env node

const chalk = require('chalk');
const argv = require('minimist')(process.argv.slice(2));

const genRss = require('./rss');
const genJson = require('./json');
const { getTotal, cmdHelp } = require('./utils');

const { owner, repo, token, mode } = argv;

async function init() {
  if (argv.h || argv.help) {
    cmdHelp();
    process.exit();
  }

  if (!owner || !repo || !token) {
    console.log('\n', chalk.red('required: `owner`, `repo`, `token`'));
    process.exit();
  }

  const repoLink = `https://github.com/${owner}/${repo}`;
  totalCount = await getTotal();

  let _mode = ['rss'];
  if (mode) _mode = mode.split(',');

  console.log();

  if (/rss|json/.test(_mode.join(','))) {
    if (_mode.includes('rss')) genRss(totalCount, repoLink);
    if (_mode.includes('json')) genJson(totalCount);
  } else {
    console.log(chalk.red`mode is invalid. example: ${chalk.green`--mode: json,rss`}`);
  }
}

init().catch((e) => {
  console.log(e);
});
