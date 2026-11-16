# freelance-cashflow

This template should help get you started developing with Vue 3 in Vite.

## Statement balances and estimates

The CSV importer uses an explicit opening balance or bank balance when present. If
neither is provided, enter the bank balance immediately before the first
transaction; the sum of transactions alone is not a bank balance. Transactions
are ordered by date, and an explicit balance on a row anchors the subsequent
running balance.

Available cash is an estimate: the app subtracts one month of detected recurring
expenses and an indicative VAT reserve (one sixth of all positive transactions)
from the latest balance. This reserve does not account for VAT returns, deductible
VAT, or previous payments, so it is not an accounting calculation. The chart is
a 90-day forecast based on the latest balance, estimated expenses and selected
scenarios; it does not predict future customer payments unless added as a
scenario.

Run the parser regression tests with `node --test tests\cashflowParser.test.js`.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
