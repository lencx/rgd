const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const yaml = require('js-yaml');

const { graphqlClient } = require('./utils');
const { fetchDiscussionsJsonData, fetchDiscussionData } = require('./discussionsJson');

const { owner, repo, jsonfmt, jsontype } = argv;

const fmt = jsonfmt === 'true' ? 2 : 0;
const dataType = jsontype === 'md' ? 'body' : 'bodyHTML';

module.exports = async function genIssuesJson(issuesTotal, discussionsTotal) {
  const limit = 100;
  let list = [];
  let last = null;

  const outdir = argv.outdir || '.';
  fs.mkdirSync(path.resolve(outdir, 'issues'), { recursive: true });

  if (owner && repo) {
    // rgd.yml
    for (let i = 0; i < Math.ceil(discussionsTotal / limit); i++) {
      const temp = await fetchDiscussionsJsonData(last);
      for (let j = 0; j < temp.length; j++) {
        let _node = temp[j].node || {};
        if (_node.title === 'rgd.yml') {
          const rgdYml = await fetchDiscussionData(_node.number, 'body');
          const _config = rgdYml.body.replace(/(```ya?ml)|(```)/g, '');
          const _json = yaml.load(_config, 'utf8');
          fs.writeFile(path.resolve(outdir, `rgd.json`), JSON.stringify(_json, null, fmt), function(err) {
            if (err) return console.error(err);
            console.log(chalk.green`rgd.json`);
          });
          fs.writeFile(path.resolve(outdir, `rgd.yml`), _config, function(err) {
            if (err) return console.error(err);
            console.log(chalk.green`rgd.yml`);
          });
          break;
        }
      }
    }
  }


  // issues list
  for (let i = 0; i < Math.ceil(issuesTotal / limit); i++) {
    const temp = await fetchIssuesJsonData(last);
    last = Array.from(temp).pop().cursor;
    list = [...list, ...temp];
  }

  fs.writeFile(path.resolve(outdir, 'discussions.json'), JSON.stringify(list, null, fmt), function(err) {
    if (err) console.error(err);
  });

  // issues item
  list.forEach(async ({ node }) => {
    if (!node) return;
    const issuesData = await fetchIssueData(node.number);

    fs.writeFile(path.resolve(outdir, `issues/${node.number}.json`), JSON.stringify(issuesData, null, fmt), function(err) {
      if (err) return console.error(err);
      console.log(chalk.green`[#${node.number}]`, chalk.yellow`${issuesData.title}`);
    });
  });
}

async function fetchIssuesJsonData(lastCursor) {
  const { repository } = await graphqlClient(`
    query ($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        issues(first: 100, after: $cursor) {
          edges {
            cursor
            node {
              title
              number
              updatedAt
              author {
                login
                avatarUrl
                url
              }
              labels(first: 100) {
                edges {
                  node {
                    id
                    name
                    color
                    description
                  }
                }
              }
            }
          }
        }
      }
    }
  `, {
    owner: argv['issues-owner'],
    repo: argv['issues-repo'],
    cursor: lastCursor,
  });

  return repository.issues.edges;
}

async function fetchIssueData(number, type) {
  const { repository } = await graphqlClient(`
    query ($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
          title
          number
          updatedAt
          ${type || dataType}
          author {
            login
            avatarUrl
            url
          }
          labels(first: 100) {
            edges {
              node {
                id
                name
                color
                description
              }
            }
          }
          reactions(first: 100) {
            totalCount
            edges {
              node {
                id
                content
              }
            }
          }
          comments(first: 100) {
            edges {
              node {
                id
                ${dataType}
                updatedAt
                author {
                  login
                  avatarUrl
                  url
                }
              }
            }
          }
        }
      }
    }
  `, {
    owner: argv['issues-owner'],
    repo: argv['issues-repo'],
    number,
  });

  return repository.issue;
}