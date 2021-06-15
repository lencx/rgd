#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const dayjs = require('dayjs');
const { graphql } = require("@octokit/graphql");
const argv = require('minimist')(process.argv.slice(2));

// const cwd = process.cwd();

const { owner, repo, token, } = argv;

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

  const repoLink = `https://github.com/${owner}/${repo}`;

  const { repository } = await graphqlClient(`
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        discussions(first: 3) {
          edges {
            node {
              title
              number
              updatedAt
              bodyHTML
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
  // console.log(JSON.stringify(repository, null, 2));
  const { discussions } = repository;
  if (discussions) {
    let content = '';
    discussions.edges.forEach(({ node }) => {
      const issuesLink =  `${repoLink}/discussions/${node.number}`;
      content += postItem({ title: node.title, link: issuesLink, date: dayjs(node.updatedAt).format('YYYY-MM-DD'), html: node.bodyHTML });
    });

    const feedxml = feedXML({
      siteTitle: '浮之静',
      siteLink: 'https://z.nofwl.com',
      siteDesc: '浮之静 技术社区',
      feed: 'feed.xml',
      postItems: content,
    })

    fs.writeFileSync(path.resolve('.', 'feed.xml'), feedxml);
  }
}

init().catch((e) => {
  console.log(e);
});

function cmdHelp() {
  return console.log(`
usage: rgd [--owner] [--repo] [--token] [--outdir]
generate token: ${chalk.blue('https://github.com/settings/tokens/new')}`);
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

function feedXML({ siteTitle, siteLink, siteDesc, feed, postItems }) {
  return `<?xml version=\"1.0\" encoding=\"utf-8\"?><rss xmlns:atom=\"http://www.w3.org/2005/Atom\" version=\"2.0\">
<channel>
  <title>${siteTitle}</title>
  <atom:link href=\"${siteLink}/${feed}\" rel=\"self\" type=\"application/rss+xml\" />
  <link>${siteLink}</link>
  <description>${siteDesc}</description>
  ${postItems}
</channel>
</rss>`
}