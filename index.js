#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const argv = require('minimist')(process.argv.slice(2));

const genDiscussionsRss = require('./discussionsRss');
const genIssuesRss = require('./issuesRss');
const genIssuesJson = require('./issuesJson');
const genDisJson = require('./disJson');
const { genDiscussionsJson } = require('./discussionsJson');
const { getDiscussionsTotal, getIssuesTotal, cmdHelp, fmtArgs } = require('./utils');

// owner: github uername
// repo: github repo
// type: discussions | discussions2 | issues, default is `discussions`
// jsontype: true | false, beautify json, default `false`
// jsontype: md | html, default is `html`
const { owner, repo, type, token, mode } = fmtArgs();

async function init() {
  if (argv.h || argv.help) {
    cmdHelp();
    process.exit();
  }

  if (!owner || !repo || !token) {
    console.log('\n', chalk.red('required: `owner`, `repo`, `token`'));
    process.exit();
  }

  fs.rmSync(argv.outdir, { recursive: true, force: true });

  const repoLink = `https://github.com/${owner}/${repo}`;
  let discussionsTotalCount = 0;
  if (owner && repo) discussionsTotalCount = await getDiscussionsTotal()

  let _mode = ['rss'];
  if (mode) _mode = mode.split(',');

  console.log();

  if (type === 'issues') {
    if (!argv['issues-owner'] || !argv['issues-repo']) {
      console.log(chalk.red('required: `owner`, `repo`, `issues-owner`, `issues-repo`, `token`'));
      process.exit();
    }
    const issuesTotalCount = await getIssuesTotal();
    if (/rss|json/.test(_mode.join(','))) {
      if (_mode.includes('rss')) genIssuesRss(issuesTotalCount, repoLink);
      if (_mode.includes('json')) genIssuesJson(issuesTotalCount, discussionsTotalCount);
    } else {
      console.log(chalk.red`mode is invalid. example: ${chalk.green`--mode: json,rss`}`);
    }
    return;
  }

  if (type === 'discussions2') {
    if (!argv['dis-owner'] || !argv['dis-repo']) {
      console.log(chalk.red('required: `owner`, `repo`, `dis-owner`, `dis-repo`, `token`'));
      process.exit();
    }
    const issuesTotalCount = await getDiscussionsTotal(argv['dis-owner'], argv['dis-repo']);
    if (/rss|json/.test(_mode.join(','))) {
      if (_mode.includes('rss')) genDiscussionsRss(issuesTotalCount, repoLink, argv['dis-owner'], argv['dis-repo']);
      if (_mode.includes('json')) genDisJson(issuesTotalCount, discussionsTotalCount);
    } else {
      console.log(chalk.red`mode is invalid. example: ${chalk.green`--mode: json,rss`}`);
    }
    return;
  }

  if (/rss|json/.test(_mode.join(','))) {
    if (_mode.includes('rss')) genDiscussionsRss(discussionsTotalCount, repoLink);
    if (_mode.includes('json')) genDiscussionsJson(discussionsTotalCount);
  } else {
    console.log(chalk.red`mode is invalid. example: ${chalk.green`--mode: json,rss`}`);
  }
}

init().catch((e) => {
  console.log(e);
});
