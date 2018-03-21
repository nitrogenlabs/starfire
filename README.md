![Starfire Banner](https://raw.githubusercontent.com/starfire/starfire-logo/master/images/starfire-banner-light.png)

<h2 align="center">Opinionated Code Formatter</h2>

<p align="center">
  <em>
  JavaScript
  · Flow
  · TypeScript
  · CSS
  · SCSS
  · Less
  · JSX
  · Vue
  · GraphQL
  · JSON
  · Markdown
  · <a href="https://starfire.io/docs/en/plugins.html">
      Your favorite language?
    </a>
  </em>
</p>

<p align="center">
  <a href="https://gitter.im/jlongster/starfire">
    <img alt="Gitter" src="https://img.shields.io/gitter/room/jlongster/starfire.svg?style=flat-square">
  </a>
  <a href="https://travis-ci.org/starfire/starfire">
    <img alt="Travis" src="https://img.shields.io/travis/starfire/starfire/master.svg?style=flat-square">
  </a>
  <a href="https://codecov.io/gh/starfire/starfire">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/starfire/starfire.svg?style=flat-square">
  </a>
  <a href="https://www.npmjs.com/package/starfire">
    <img alt="npm version" src="https://img.shields.io/npm/v/starfire.svg?style=flat-square">
  </a>
  <a href="https://www.npmjs.com/package/starfire">
    <img alt="monthly downloads" src="https://img.shields.io/npm/dm/starfire.svg?style=flat-square">
  </a>
  <a href="#badge">
    <img alt="code style: starfire" src="https://img.shields.io/badge/code_style-starfire-ff69b4.svg?style=flat-square">
  </a>
  <a href="https://twitter.com/StarfireCode">
    <img alt="Follow+Starfire+on+Twitter" src="https://img.shields.io/twitter/follow/starfirecode.svg?label=follow+starfire&style=flat-square">
  </a>
</p>

## Intro

Starfire is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing it with its own rules that take the maximum line length into account, wrapping code when necessary.

### Input

<!-- starfire-ignore -->
```js
foo(reallyLongArg(), omgSoManyParameters(), IShouldRefactorThis(), isThereSeriouslyAnotherOne());
```

### Output

```js
foo(
  reallyLongArg(),
  omgSoManyParameters(),
  IShouldRefactorThis(),
  isThereSeriouslyAnotherOne()
);
```

Starfire can be run [in your editor](http://starfire.io/docs/en/editors.html) on-save, in a [pre-commit hook](https://starfire.io/docs/en/precommit.html), or in [CI environments](https://starfire.io/docs/en/cli.html#list-different) to ensure your codebase has a consistent style without devs ever having to post a nit-picky comment on a code review ever again!

---

**[Documentation](https://starfire.io/docs/en/)**

<!-- starfire-ignore -->
[Install](https://starfire.io/docs/en/install.html) ·
[Options](https://starfire.io/docs/en/options.html) ·
[CLI](https://starfire.io/docs/en/cli.html) ·
[API](https://starfire.io/docs/en/api.html)

**[Playground](https://starfire.io/playground/)**

---

## Badge

Show the world you're using _Starfire_ → [![code style: starfire](https://img.shields.io/badge/code_style-starfire-ff69b4.svg?style=flat-square)](https://github.com/starfire/starfire)

```md
[![code style: starfire](https://img.shields.io/badge/code_style-starfire-ff69b4.svg?style=flat-square)](https://github.com/starfire/starfire)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
