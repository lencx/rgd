const chalk = require('chalk');
const { graphql } = require("@octokit/graphql");
const argv = require('minimist')(process.argv.slice(2));
const _ = require('lodash');

const g = chalk.green;
const y = chalk.yellow;

const { owner, repo, token } = fmtArgs();

const graphqlClient = graphql.defaults({
  headers: {
    authorization: `token ${token}`,
  },
});

module.exports = {
  graphqlClient,
  cmdHelp,
  getDiscussionsTotal,
  getIssuesTotal,
  fmtJsonKey,
  fmtArgs,
};

function cmdHelp() {
  return console.log(`
usage: ${g`rgd`}

options:
  ${g`--owner`}:          github username
  ${g`--repo`}:           github repository
  ${g`--type`}:           discussions | discussions2 | issues, default is \`discussions\`
  ${g`--issues-owner`}:   github username(issues) - data owner
  ${g`--issues-repo`}:    github repository(issues) - data repo
  ${g`--dis-owner`}:      github username(discussions2) - data owner
  ${g`--dis-repo`}:       github repository(discussions2) - data repo
  ${g`--issues-state`}:   github issues states (issues), \`OPEN\` or \`CLOSED\`, by default no filtering
  ${g`--mode`}:           api generates json files, rss files, etc. default ${y`rss`}
                    example: ${y`--mode=json,rss`}
  ${g`--jsonfmt`}:        beautify json, default ${y`false`}
  ${g`--jsontype`}:       \`md\` or \`html\`, default ${y`html`}
  ${g`--token`}:          generate token -> https://github.com/settings/tokens/new
  ${g`--limit`}:          if not set, all are requested by default, value is number, no more than 100
  ${g`--outdir`}:         output file root directory, default \`${y`.`}\`
  ${g`--filename`}:       rss file name, default ${y`feed.xml`}
  ${g`--site-title`}:     default ${y`RSS`}
  ${g`--site-link`}:      defalut ${y`/`}
  ${g`--site-desc`}:      defalut ${y`GitHub Discussions`}`);
}

async function getDiscussionsTotal(_owner = owner, _repo = repo) {
  const _data = await graphqlClient(`
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussions {
          totalCount
        }
      }
    }
  `, {
    owner: _owner,
    repo: _repo,
  });

  return _data.repository.discussions.totalCount;
}

async function getIssuesTotal() {
  const _data = await graphqlClient(`
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        issues {
          totalCount
        }
      }
    }
  `, {
    owner: argv['issues-owner'],
    repo: argv['issues-repo'],
  });

  return _data.repository.issues.totalCount;
}

function fmtJsonKey(data) {
  _.mixin({
    deeply: function (map) {
        return function(obj, fn) {
            return map(_.mapValues(obj, function (v) {
                return _.isPlainObject(v) ? _.deeply(map)(v, fn) : v;
            }), fn);
        }
    },
  });
  return _.deeply(_.mapKeys)(data, function (_, key) {
    return key.replace(/-/g, '_');
  });
}

function fmtArgs() {
  const { owner, repo, repository = '', token, ...rest } = argv;
  const a = repository?.split('/');
  return { owner: a[0] || owner, repo: a[1] || repo, token, ...rest };
}