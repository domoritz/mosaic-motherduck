import { MDConnection } from "@motherduck/wasm-client";
import * as vg from "@uwdata/vgplot";
import { token } from "./token.js";
import * as arrow from "apache-arrow";

async function arrowTableFromResult(result) {
  if (result.type === "streaming") {
    const batches = await result.arrowStream.readAll();
    return new arrow.Table(batches);
  }
  throw Error("expected streaming result");
}

function mdConnector(token) {
  const connection = MDConnection.create({
    mdToken: token,
  });
  return {
    query: async (query) => {
      const { sql, type } = query;
      const result = await connection.evaluateStreamingQuery(sql);
      switch (type) {
        case "arrow":
          return arrowTableFromResult(result);
        case "json":
          return Array.from(await arrowTableFromResult(result));
        default:
        case "exec":
          return undefined;
      }
    },
  };
}

const connector = mdConnector(token);

const app = document.querySelector("#app");

vg.coordinator().databaseConnector(connector);

const $brush = vg.Selection.crossfilter();

const table = "ugly-duck.main.flights10m";

const chart = vg.vconcat(
  vg.plot(
    vg.rectY(vg.from(table, { filterBy: $brush }), {
      x: vg.bin("delay"),
      y: vg.count(),
      fill: "steelblue",
      inset: 0.5,
    }),
    vg.intervalX({ as: $brush }),
    vg.xDomain(vg.Fixed),
    vg.yTickFormat("s"),
    vg.width(600),
    vg.height(200)
  ),
  vg.plot(
    vg.rectY(vg.from(table, { filterBy: $brush }), {
      x: vg.bin("time"),
      y: vg.count(),
      fill: "steelblue",
      inset: 0.5,
    }),
    vg.intervalX({ as: $brush }),
    vg.xDomain(vg.Fixed),
    vg.yTickFormat("s"),
    vg.width(600),
    vg.height(200)
  ),
  vg.plot(
    vg.rectY(vg.from(table, { filterBy: $brush }), {
      x: vg.bin("distance"),
      y: vg.count(),
      fill: "steelblue",
      inset: 0.5,
    }),
    vg.intervalX({ as: $brush }),
    vg.xDomain(vg.Fixed),
    vg.yTickFormat("s"),
    vg.width(600),
    vg.height(200)
  )
);

app.replaceChildren(chart);
