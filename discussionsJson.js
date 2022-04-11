const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const yaml = require('js-yaml');

const { graphqlClient, fmtJsonKey, fmtArgs } = require('./utils');

const { owner, repo, jsonfmt, jsontype } = fmtArgs();

const fmt = jsonfmt === 'true' ? 2 : 0;
const dataType = jsontype === 'md' ? 'body' : 'bodyHTML';

module.exports = {
  genDiscussionsJson,
  fetchDiscussionData,
  fetchDiscussionsJsonData,
};

async function genDiscussionsJson(totalCount) {
  const limit = 100;
  let list = [];
  let last = null;

  for (let i = 0; i < Math.ceil(totalCount / limit); i++) {
    const temp = await fetchDiscussionsJsonData(last);
    temp.map(async (item) => {
      let _node = item.node || {};
      if (_node.title === 'rgd.yml') {
        const rgdYml = await fetchDiscussionData(_node.number, 'body');
        const _config = rgdYml.body.replace(/(```ya?ml)|(```)/g, '');
        const _json = yaml.load(_config, 'utf8');
        const _fmtJson = fmtJsonKey(_json);
        fs.writeFile(path.resolve(outdir, `rgd.json`), JSON.stringify(_fmtJson, null, fmt), function(err) {
          if (err) return console.error(err);
          console.log(chalk.green`rgd.json`);
        });
        fs.writeFile(path.resolve(outdir, `rgd.yml`), _config, function(err) {
          if (err) return console.error(err);
          console.log(chalk.green`rgd.yml`);
        });
      }
      return item;
    });

    last = Array.from(temp).pop().cursor;
    list = [...list, ...temp];
  }

  const outdir = argv.outdir || '.';

  fs.mkdirSync(path.resolve(outdir, 'issues'), { recursive: true });

  fs.writeFile(path.resolve(outdir, 'discussions.json'), JSON.stringify(list, null, fmt), (err) => {
    if (err) console.error(err);
    console.log(chalk.green`discussions.json`);
  });

  list.forEach(async ({ node }) => {
    if (!node) return;
    const issuesData = await fetchDiscussionData(node.number);
    fs.writeFile(path.resolve(outdir, `issues/${node.number}.json`), JSON.stringify(issuesData, null, fmt), (err) => {
      if (err) return console.error(err);
      console.log(chalk.green`[#${node.number}]`, chalk.yellow`${issuesData.title}`);
    });
  });
}

async function fetchDiscussionsJsonData(lastCursor) {
  const { repository } = await graphqlClient(`
    query ($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 100, after: $cursor) {
          edges {
            cursor
            node {
              title
              number
              createdAt
              updatedAt
              author {
                login
                avatarUrl
                url
              }
              category {
                name
                emoji
                description
                isAnswerable
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
    owner,
    repo,
    cursor: lastCursor,
  });

  return repository.discussions.edges;
}

async function fetchDiscussionData(number, type) {
  const { repository } = await graphqlClient(`
    query ($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          id
          title
          number
          upvoteCount
          createdAt
          updatedAt
          ${type || dataType}
          author {
            login
            avatarUrl
            url
          }
          category {
            name
            emoji
            description
            isAnswerable
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
                upvoteCount
                updatedAt
                author {
                  login
                  avatarUrl
                  url
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
                replies(first: 100) {
                  edges {
                    node {
                      id
                      author {
                        login
                        avatarUrl
                        url
                      }
                      ${dataType}
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `, {
    owner,
    repo,
    number,
  });

  return repository.discussion;
}
