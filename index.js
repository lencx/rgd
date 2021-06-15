#!/usr/bin/env node

const { graphql } = require("@octokit/graphql");
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

// const cwd = process.cwd();

const { owner, repo, token, } = argv;

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${token}`,
  },
});

async function init() {
  if (argv.h || argv.help) {
    cmdHelp();
    process.exit();
  }

  if (!owner || !repo || !token) {
    console.log('\n', chalk.red('required: `owner`, `repo`, `token`'));
    process.exit();
  }

  const { repository } = await graphqlWithAuth(`
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 3) {
          edges {
            node {
              title
              number
              # bodyHTML
              category {
                name
                # emojiHTML
              }
            }
          }
        }
      }
    }
  `, {
    owner,
    repo,
  });
  console.log(JSON.stringify(repository, null, 2));
}

init().catch((e) => {
  console.log(e);
});

function cmdHelp() {
  return console.log(`
usage: rgd [--owner] [--repo] [--token]
generate token: ${chalk.blue('https://github.com/settings/tokens/new')}`);
}