# Mosaic + MotherDuck Demo

A quick demo application without any additional frameworks of how [Mosaic](https://uwdata.github.io/mosaic/) can work with [MotherDuck](https://motherduck.com) (specifically, the [WebAssembly client library](https://github.com/motherduckdb/wasm-client)).
I built this in an evening which shows how easy it is. It's not super polished but that hopefully makes it easier to understand.

To run the example, install the dependencies with `npm i`. You will need to create a `token.js` file that exports your MotherDuck API token as `token`.

```js
export const token = "..."
```

Then run the server with `npm run dev`.
