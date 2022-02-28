const chalk = require('chalk');
const { graphql } = require("@octokit/graphql");
const argv = require('minimist')(process.argv.slice(2));

const { owner, repo, token } = argv;
const g = chalk.green;
const y = chalk.yellow;

const graphqlClient = graphql.defaults({
  headers: {
    authorization: `token ${token}`,
  },
});

module.exports = {
  graphqlClient,
  cmdHelp,
  getTotal,
};

function cmdHelp() {
  return console.log(`
usage: ${g`rgd`}

options:
  ${g`--owner`}:      github username
  ${g`--repo`}:       github repository
  ${g`--mode`}:       api generates json files, rss files, etc. default ${y`rss`}
                example: ${y`--mode=json,rss`}
  ${g`--jsonfmt`}:    beautify json, default ${y`false`}
  ${g`--jsontype`}:   \`md\` or \`html\`, default ${y`html`}
  ${g`--token`}:      generate token -> https://github.com/settings/tokens/new
  ${g`--limit`}:      if not set, all are requested by default, value is number, no more than 100
  ${g`--outdir`}:     output file root directory, default \`${y`.`}\`
  ${g`--filename`}:   rss file name, default ${y`feed.xml`}
  ${g`--site-title`}: default ${y`RSS`}
  ${g`--site-link`}:  defalut ${y`/`}
  ${g`--site-desc`}:  defalut ${y`GitHub Discussions`}`);
}

async function getTotal() {
  const _data = await graphqlClient(`
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussions {
          totalCount
        }
      }
    }
  `, {
    owner,
    repo,
  });

  return _data.repository.discussions.totalCount;
}