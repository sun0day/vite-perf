import { spawn, spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright";
import { EventEmitter } from "node:events";

const yellow = (text: string) => {
  return `\x1b[33m${text}\x1b[0m`;
};

interface Metric {
  startUp?: number;
  prebundle?: number;
  loadConfig?: number;
  initTsconfck?: number;
  scanDependencies?: number;
  pageLoad?: number;
}

class Perf extends EventEmitter {
  metric: Metric = {};
  version: string;
  path: string = "";
  hashConsistent = false;

  getPath(output: string) {
    if (this.path) {
      return;
    }

    const matcher = output.match(/local:.*(http\S+)/i);

    if (matcher?.[1]) {
      this.path = matcher[1];
    }
  }

  getHashChanged(output: string) {
    if (this.hashConsistent) {
      return;
    }

    const matcher = output.match(/vite\:deps.*?hash.+?consistent/i);

    if (matcher?.length) {
      this.hashConsistent = true;
    }
  }

  getStartUp(output: string) {
    if (this.metric.startUp) {
      return;
    }

    const matcher = output.match(/ready\s+in.*?([\d\.]+)\s*ms/i);

    if (matcher?.[1]) {
      this.metric.startUp = +matcher[1];
      this.emit("data", { metric: "startUp", value: this.metric.startUp });
      this.emit("startUp");
    }
  }

  getScanDependencies(output: string) {
    if (this.metric.scanDependencies) {
      return;
    }

    const matcher = output.match(
      /vite\:deps.*?scan\s*completed.*?([\d\.]+)\s*ms/i
    );

    if (matcher?.[1]) {
      this.metric.scanDependencies = +matcher[1];
      this.emit("data", {
        metric: "scanDependencies",
        value: this.metric.scanDependencies,
      });
    }
  }

  getPrebundle(output: string) {
    if (this.metric.prebundle) {
      return;
    }

    const matcher = output.match(
      /vite\:deps.*?dependencies\s*bundled.*?([\d\.]+)\s*ms/i
    );

    if (matcher?.[1]) {
      this.metric.prebundle = +matcher[1];
      this.emit("data", { metric: "prebundle", value: this.metric.prebundle });
      this.emit("prebundle");
    }
  }

  getLoadConfig(output: string) {
    if (this.metric.loadConfig) {
      return;
    }
    const matcher = output.match(/vite\:config.+?loaded.+?([\d\.]+)ms/);

    if (matcher?.[1]) {
      this.metric.loadConfig = +matcher[1];
      this.emit("data", {
        metric: "loadConfig",
        value: this.metric.loadConfig,
      });
    }
  }

  getInitTsconfck(output: string) {
    if (this.metric.initTsconfck) {
      return;
    }
    const matcher = output.match(/vite\:esbuild.*?([\d\.]+)ms.*?tsconfck/);

    if (matcher?.[1]) {
      this.metric.initTsconfck = +matcher[1];
      this.emit("data", {
        metric: "initTsconfck",
        value: this.metric.initTsconfck,
      });
    }
  }

  async getPageLoad() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const start = performance.now();
    await page.goto(this.path);
    this.metric.pageLoad = +(performance.now() - start).toFixed(2);
    this.emit("data", { metric: "pageLoad", value: this.metric.pageLoad });
    await browser.close();
  }
}

export async function startServer(options: { force?: boolean; load?: string }) {
  spawnSync("vite", ["-v"], { stdio: "inherit" });
  console.log("\n");

  const loadOnStartUp = options.load === "startUp";
  const loadOnPrebundle = options.load === "prebundle";
  const ora = await import("ora");
  const spinner = ora.default("waiting for vite server...").start();
  const viteServerOptions = ["--debug", "deps,config,esbuild"];

  if (options.force) {
    viteServerOptions.unshift("--force");
  }
  const viteServer = spawn("vite", viteServerOptions, {
    stdio: "pipe",
  });
  const exit = () => {
    spinner.start("waiting to exit...");
    setTimeout(() => {
      spinner.stop();
      console.log("\n");
      viteServer.kill();
      process.exit();
    }, 1000);
  };

  const perf = new Perf();

  viteServer.stdout.on("data", (data) => {
    const output = data.toString();
    perf.getStartUp(output);
    perf.getPath(output);
  });

  viteServer.stderr.on("data", (data) => {
    const output = data.toString();
    perf.getHashChanged(output);
    perf.getLoadConfig(output);
    perf.getInitTsconfck(output);
    perf.getScanDependencies(output);
    perf.getPrebundle(output);
  });

  perf.on("data", ({ metric, value }) => {
    switch (metric) {
      case "startUp":
        spinner.succeed(`server start up in: ${yellow(value)} ms`);
        if (!perf.hashConsistent) {
          spinner.start("waiting to collect...");
        }
        break;
      case "scanDependencies":
        spinner
          .succeed(`scan dependencies in: ${yellow(value)} ms`)
          .start("waiting to collect...");
        break;
      case "loadConfig":
        spinner
          .succeed(`load config in: ${yellow(value)} ms`)
          .start("waiting to collect...");
        break;
      case "initTsconfck":
        spinner
          .succeed(`init tsconfck in: ${yellow(value)} ms`)
          .start("waiting to collect...");
        break;
      case "prebundle":
        spinner.succeed(`pre bundle in: ${yellow(value)} ms`);
        if (loadOnPrebundle) {
          spinner.start("waiting to collect...");
        }
        break;
      case "pageLoad":
        spinner.succeed(
          `page load on ${
            loadOnStartUp ? "start up" : "pre bundle"
          } in: ${yellow(value)} ms`
        );
    }
  });

  perf.on("startUp", async () => {
    if (perf.hashConsistent) {
      exit();
    }

    if (loadOnStartUp) {
      await perf.getPageLoad();
      exit();
    }
  });

  perf.on("prebundle", async () => {
    loadOnPrebundle && (await perf.getPageLoad());
    if (!loadOnStartUp) {
      exit();
    }
  });
}
