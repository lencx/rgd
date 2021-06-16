#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const dayjs = require('dayjs');
const { graphql } = require("@octokit/graphql");
const argv = require('minimist')(process.argv.slice(2));

const { owner, repo, token } = argv;

const graphqlClient = graphql.defaults({
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

  const fetchData = async (size, lastCursor) => {
    const { repository } = await graphqlClient(`
      query ($owner: String!, $repo: String!, $limit: Int!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          discussions(first: $limit, after: $cursor) {
            edges {
              cursor
              node {
                title
                number
                updatedAt
                bodyHTML
              }
            }
          }
        }
      }
    `, {
      owner,
      repo,
      limit: size,
      cursor: lastCursor,
    });
    return repository.discussions.edges;
  }

  const repoLink = `https://github.com/${owner}/${repo}`;
  let totalCount;
  let limit = 20;
  let list = [];
  let last = null;

  if (!argv.limit) {
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

    totalCount = _data.repository.discussions.totalCount;
    for (let i = 0; i < Math.ceil(totalCount / limit); i++) {
      const temp = await fetchData(limit, last);
      last = Array.from(temp).pop().cursor;
      list = [...list, ...temp];
    }
  } else {
    limit = +argv.limit;
    const temp = await fetchData(limit, null);
    list = temp;
  }


  let content = '';
  list.forEach(({ node }) => {
    const issuesLink =  `${repoLink}/discussions/${node.number}`;
    content += postItem({ title: node.title, link: issuesLink, date: dayjs(node.updatedAt).format('YYYY-MM-DD'), html: node.bodyHTML });
  });

  const feedxml = feedXML({
    siteTitle: argv['site-title'] || 'RSS',
    siteLink: argv['site-link'] || '/',
    siteDesc: argv['site-desc'] || 'GitHub Discussions',
    filename: argv.filename || 'feed.xml',
    postItems: content,
  })

  if (argv.outdir) fs.mkdirSync(path.resolve(argv.outdir), { recursive: true })
  fs.writeFileSync(path.resolve(argv.outdir || '.', 'feed.xml'), feedxml);
}

init().catch((e) => {
  console.log(e);
});

function cmdHelp() {
  return console.log(`
usage: rgd

options:
  --owner
  --repo
  --token: generate token -> https://github.com/settings/tokens/new
  --limit: if not set, all are requested by default, value is number, no more than 100.
  --outdir: default \`.\`
  --filename: default \`feed.xml\`
  --site-title: default \`RSS\`
  --site-link: defalut \`/\`
  --site-desc: defalut \`GitHub Discussions\``);
}

function postItem({ title, link, date, html }) {
  return `<item>
  <title><![CDATA[${title}]]></title>
  <link>${link}</link>
  <guid isPermaLink=\"false\">${link}</guid>
  <pubDate>${date}</pubDate>
  <description><![CDATA[${html}]]></description>
</item>
`
}

function feedXML({ siteTitle, siteLink, siteDesc, filename, postItems }) {
  return `<?xml version=\"1.0\" encoding=\"utf-8\"?><rss xmlns:atom=\"http://www.w3.org/2005/Atom\" version=\"2.0\">
<channel>
  <title>${siteTitle}</title>
  <atom:link href=\"${siteLink.replace(/\/$/, '')}/${filename}\" rel=\"self\" type=\"application/rss+xml\" />
  <link>${siteLink}</link>
  <description>${siteDesc}</description>
  ${postItems}
</channel>
</rss>`
}