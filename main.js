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

const table = "gaia-import.main.gaia_sample_1_percent_projected"

const size = await connector.query({ sql: `SELECT COUNT(*) as cnt FROM ${table.split(".").map(s => `"${s}"`).join(".")}`, type: "arrow" })

const count = document.createElement("div")
count.innerHTML = `Number of rows: ${new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(size.get(0).cnt)}`

app.appendChild(count);

const $brush = vg.Selection.crossfilter();
const $bandwidth = vg.Param.value(0);
const $pixelSize = vg.Param.value(2);
const $scaleType = vg.Param.value("sqrt");

const chart = vg.hconcat(
  vg.vconcat(
    vg.plot(
      vg.raster(vg.from(table, { filterBy: $brush }), {
        x: "u",
        y: "v",
        fill: "density",
        bandwidth: $bandwidth,
        pixelSize: $pixelSize,
      }),
      vg.intervalXY({ pixelSize: 2, as: $brush }),
      vg.xyDomain(vg.Fixed),
      vg.colorScale($scaleType),
      vg.colorScheme("viridis"),
      vg.width(880),
      vg.height(500),
      vg.marginLeft(25),
      vg.marginTop(20),
      vg.marginRight(1)
    ),
    vg.hconcat(
      vg.plot(
        vg.rectY(vg.from(table, { filterBy: $brush }), {
          x: vg.bin("phot_g_mean_mag"),
          y: vg.count(),
          fill: "steelblue",
          inset: 0.5,
        }),
        vg.intervalX({ as: $brush }),
        vg.xDomain(vg.Fixed),
        vg.yScale($scaleType),
        vg.yGrid(true),
        vg.width(440),
        vg.height(240),
        vg.marginLeft(65)
      ),
      vg.plot(
        vg.rectY(vg.from(table, { filterBy: $brush }), {
          x: vg.bin("parallax"),
          y: vg.count(),
          fill: "steelblue",
          inset: 0.5,
        }),
        vg.intervalX({ as: $brush }),
        vg.xDomain(vg.Fixed),
        vg.yScale($scaleType),
        vg.yGrid(true),
        vg.width(440),
        vg.height(240),
        vg.marginLeft(65)
      )
    )
  ),
  vg.hspace(10),
  vg.plot(
    vg.raster(vg.from(table, { filterBy: $brush }), {
      x: "bp_rp",
      y: "phot_g_mean_mag",
      fill: "density",
      bandwidth: $bandwidth,
      pixelSize: $pixelSize,
    }),
    vg.intervalXY({ pixelSize: 2, as: $brush }),
    vg.xyDomain(vg.Fixed),
    vg.colorScale($scaleType),
    vg.colorScheme("viridis"),
    vg.yReverse(true),
    vg.width(460),
    vg.height(740),
    vg.marginLeft(25),
    vg.marginTop(20),
    vg.marginRight(1)
  )
);

app.appendChild(chart);
