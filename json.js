const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

const { graphqlClient } = require('./utils');

const { owner, repo, jsonfmt, jsontype } = argv;

const fmt = jsonfmt === 'true' ? 2 : 0;
const dataType = jsontype === 'md' ? 'body' : 'bodyHTML';

module.exports = async function genJson(totalCount) {
  const limit = 100;
  let list = [];
  let last = null;

  for (let i = 0; i < Math.ceil(totalCount / limit); i++) {
    const temp = await fetchJsonData(last);
    last = Array.from(temp).pop().cursor;
    list = [...list, ...temp];
  }

  const outdir = argv.outdir || '.';

  fs.mkdirSync(path.resolve(outdir, 'issues'), { recursive: true });

  fs.writeFile(path.resolve(outdir, 'discussions.json'), JSON.stringify(list, null, fmt), function(err) {
    if (err) console.error(err);
  });

  list.forEach(async ({ node }) => {
    if (!node) return;
    const issuesData = await fetchIssuesData(node.number);
    fs.writeFile(path.resolve(outdir, `issues/${node.number}.json`), JSON.stringify(issuesData, null, fmt), function(err) {
      if (err) return console.error(err);
      console.log(chalk.green`[#${node.number}]`, chalk.yellow`${issuesData.title}`);
    });
  });
}

async function fetchJsonData(lastCursor) {
  const { repository } = await graphqlClient(`
    query ($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 100, after: $cursor) {
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

async function fetchIssuesData(number) {
  const { repository } = await graphqlClient(`
    query ($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          id
          title
          number
          upvoteCount
          ${dataType}
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
                author {
                  login
                  avatarUrl
                  url
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