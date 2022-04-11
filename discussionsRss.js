const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const argv = require('minimist')(process.argv.slice(2));

const { graphqlClient, fmtArgs } = require('./utils');

const { owner, repo } = fmtArgs();

module.exports = async function genDiscussionsRss(totalCount, repoLink) {
  let limit = 20;
  let list = [];
  let last = null;

  if (!argv.limit) {
    for (let i = 0; i < Math.ceil(totalCount / limit); i++) {
      const temp = await fetchRssData(limit, last);
      last = Array.from(temp).pop().cursor;
      list = [...list, ...temp];
    }
  } else {
    limit = +argv.limit;
    const temp = await fetchRssData(limit, null);
    list = temp;
  }

  let content = '';
  list.forEach(({ node }) => {
    const issuesLink =  `${repoLink}/discussions/${node.number}`;
    content += postItem({ title: node.title, link: issuesLink, date: dayjs(node.updatedAt).format('YYYY-MM-DD'), html: node.bodyHTML });
  });

  const _filename = argv.filename || 'feed.xml';

  const feedxml = feedXML({
    siteTitle: argv['site-title'] || 'RSS',
    siteLink: argv['site-link'] || '/',
    siteDesc: argv['site-desc'] || 'GitHub Discussions',
    filename: _filename,
    postItems: content,
  });

  if (argv.outdir) fs.mkdirSync(path.resolve(argv.outdir), { recursive: true });
  fs.writeFileSync(path.resolve(argv.outdir || '.', _filename), feedxml);
  console.log('✨ RSS Done!');
}

function postItem({ title, link, date, html }) {
  return `<item>
  <title><![CDATA[${title}]]></title>
  <link>${link}</link>
  <guid isPermaLink=\"false\">${link}</guid>
  <pubDate>${date}</pubDate>
  <description><![CDATA[${html}]]></description>
</item>
`;
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
</rss>`;
}

async function fetchRssData(size, lastCursor) {
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
