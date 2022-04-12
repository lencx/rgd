# rgd

> GitHub Discussions API - RSS & JSON

```bash
npm install -g rgd

# or
npm install -D rgd
```

```bash
Usage: rgd

Options:
  --owner:            github username
  --repo:             github repository
  --type:             discussions | discussions2 | issues, default is `discussions`
  --issues-owner:     github username(issues) - data owner
  --issues-repo:      github repository(issues) - data repo
  --dis-owner:        github username(discussions2) - data owner
  --dis-repo:         github repository(discussions2) - data repo
  --issues-state:     github issues states (issues), `OPEN` or `CLOSED`, by default no filtering
  --mode:             api generates json files, rss files, etc. default `rss`
                      example: `--mode=json,rss`
  --jsonfmt:          beautify json, default `false`
  --jsontype:         `md` or `html`, default `html`
  --token:            generate token -> https://github.com/settings/tokens/new
  --limit:            if not set, all are requested by default, value is number, no more than 100
  --outdir:           output file root directory, default `.`
  --filename:         rss file name, default `feed.xml`
  --site-title:       default `RSS`
  --site-link:        defalut `/`
  --site-desc:        defalut `GitHub Discussions`
```

## Usage

- [Show GitHub Discussions on your GitHub profile/project readme](https://dev.to/lencx/show-github-discussions-on-your-github-profile-project-readme-5gac)

## Related

- [lencx/gg](https://github.com/lencx/gg) - 🦄 GG (Gatsby + GitHub) - A gatsby website builder based on github discussions

## License

MIT License © 2021 [lencx](https://github.com/lencx)
