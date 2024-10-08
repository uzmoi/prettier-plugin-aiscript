# prettier-plugin-aiscript

[![NPM Version][npm-badge]](https://www.npmjs.com/package/@uzmoi/prettier-plugin-aiscript)
[![GitHub License][license-badge]](https://opensource.org/license/MIT)
[![NPM Dependency Version][aiscript-badge]](https://www.npmjs.com/package/@syuilo/aiscript)
[![Playground][playground-badge]](https://uzmoi.github.io/prettier-plugin-aiscript/)
[![code style: prettier][prettier-badge]](https://github.com/prettier/prettier)
[![Codecov][codecov-badge]](https://app.codecov.io/gh/uzmoi/prettier-plugin-aiscript)

[npm-badge]: https://img.shields.io/npm/v/@uzmoi/prettier-plugin-aiscript?style=flat-square
[license-badge]: https://img.shields.io/github/license/uzmoi/prettier-plugin-aiscript?style=flat-square
[aiscript-badge]: https://img.shields.io/npm/dependency-version/@uzmoi/prettier-plugin-aiscript/@syuilo/aiscript?style=flat-square
[playground-badge]: https://img.shields.io/github/actions/workflow/status/uzmoi/prettier-plugin-aiscript/pages.yml?style=flat-square&label=Playground
[prettier-badge]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[codecov-badge]: https://img.shields.io/codecov/c/gh/uzmoi/prettier-plugin-aiscript?style=flat-square

prettierの[AiScript](https://github.com/aiscript-dev/aiscript) pluginです。
`.is`と`.ais`拡張子のファイルをフォーマットします。

## Setup

prettierとプラグインをインストールします。

```sh
npm install -D prettier @uzmoi/prettier-plugin-aiscript
```

`.prettierrc`にプラグインを追加します。

```json
{
  "plugins": ["@uzmoi/prettier-plugin-aiscript"]
}
```
