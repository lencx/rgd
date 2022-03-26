#!/usr/bin/env node

const chalk = require('chalk');
const argv = require('minimist')(process.argv.slice(2));

const genDiscussionsRss = require('./discussionsRss');
const genIssuesRss = require('./issuesRss');
const genIssuesJson = require('./issuesJson');
const { genDiscussionsJson } = require('./discussionsJson');
const { getDiscussionsTotal, getIssuesTotal, cmdHelp } = require('./utils');

// owner: github uername
// repo: github repo
// type: discussions | issues, default is `discussions`
// jsontype: true | false, beautify json, default `false`
// jsontype: md | html, default is `html`
const { owner, repo, type, token, mode } = argv;

async function init() {
  if (argv.h || argv.help) {
    cmdHelp();
    process.exit();
  }

  if (!(owner || argv['issues-owner']) || !(repo || argv['issues-repo']) || !token) {
    console.log('\n', chalk.red('required: `owner or issues-owner`, `repo or issues-repo`, `token`'));
    process.exit();
  }

  const repoLink = `https://github.com/${owner}/${repo}`;
  let discussionsTotalCount = 0;
  if (owner && repo) discussionsTotalCount = await getDiscussionsTotal()

  let _mode = ['rss'];
  if (mode) _mode = mode.split(',');

  console.log();

  if (type === 'issues') {
    const issuesTotalCount = await getIssuesTotal();
    if (/rss|json/.test(_mode.join(','))) {
      if (_mode.includes('rss')) genIssuesRss(issuesTotalCount, repoLink);
      if (_mode.includes('json')) genIssuesJson(issuesTotalCount, discussionsTotalCount);
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
