const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const yaml = require('js-yaml');

const { fmtJsonKey, fmtArgs } = require('./utils');
const { fetchDiscussionsJsonData, fetchDiscussionData } = require('./discussionsJson');

const { jsonfmt } = fmtArgs();

const fmt = jsonfmt === 'true' ? 2 : 0;

module.exports = async function genDisJson(issuesTotal, discussionsTotal) {
  const limit = 100;
  let list = [];
  let last = null;

  const outdir = argv.outdir || '.';
  fs.mkdirSync(path.resolve(outdir, 'issues'), { recursive: true });

  if (argv['dis-owner'] && argv['dis-repo']) {
    // rgd.yml
    for (let i = 0; i < Math.ceil(discussionsTotal / limit); i++) {
      const temp = await fetchDiscussionsJsonData(last);
      for (let j = 0; j < temp.length; j++) {
        let _node = temp[j].node || {};
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
          break;
        }
      }
    }
  }

  // issues list
  for (let i = 0; i < Math.ceil(issuesTotal / limit); i++) {
    const temp = await fetchDiscussionsJsonData(last, argv['dis-owner'], argv['dis-repo']);
    last = Array.from(temp).pop().cursor;
    list = [...list, ...temp];
  }

  fs.writeFile(path.resolve(outdir, 'discussions.json'), JSON.stringify(list, null, fmt), function(err) {
    if (err) console.error(err);
  });

  // issues item
  list.forEach(async ({ node }) => {
    if (!node) return;
    const issuesData = await fetchDiscussionData(node.number, null, argv['dis-owner'], argv['dis-repo']);

    fs.writeFile(path.resolve(outdir, `issues/${node.number}.json`), JSON.stringify(issuesData, null, fmt), function(err) {
      if (err) return console.error(err);
      console.log(chalk.green`[#${node.number}]`, chalk.yellow`${issuesData.title}`);
    });
  });
}
