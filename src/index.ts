import axios from "axios";
import { Compilation, Compiler, WebpackPluginInstance } from "webpack";

interface SsiReplaceWebpackPluginOptions {
  headerUrl: string;
  footerUrl: string;
  sidebarUrl: string;
  ssiTags?: string[];
}

class SsiReplaceWebpackPlugin implements WebpackPluginInstance {
  private readonly options: SsiReplaceWebpackPluginOptions;
  private readonly defaultSsiTags: readonly string[];
  private readonly pluginName = "SsiReplaceWebpackPlugin";

  constructor(options: SsiReplaceWebpackPluginOptions) {
    this.validateOptions(options);
    this.options = options;
    this.defaultSsiTags = Object.freeze([
      "<!--#include virtual='header.html' -->",
      "<!--#include virtual='footer.html' -->",
      "<!--#include virtual='sidebar.html' -->",
    ]);
  }

  private validateOptions(options: SsiReplaceWebpackPluginOptions): void {
    const requiredUrls = ["headerUrl", "footerUrl", "sidebarUrl"];
    for (const url of requiredUrls) {
      if (!options[url as keyof SsiReplaceWebpackPluginOptions]) {
        throw new Error(`${this.pluginName}: ${url} is required`);
      }
      if (
        typeof options[url as keyof SsiReplaceWebpackPluginOptions] !== "string"
      ) {
        throw new Error(`${this.pluginName}: ${url} must be a string`);
      }
    }
  }

  apply(compiler: Compiler): void {
    if (compiler.options.mode !== "development") {
      console.warn(
        `${this.pluginName}: Plugin is meant for development mode only`
      );
      return;
    }

    compiler.hooks.thisCompilation.tap(this.pluginName, (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        {
          name: this.pluginName,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async (assets, callback) => {
          try {
            await this.processAssets(assets, compilation);
            callback();
          } catch (error) {
            callback(error instanceof Error ? error : new Error(String(error)));
          }
        }
      );
    });
  }

  private async processAssets(
    assets: Compilation["assets"],
    compilation: Compilation
  ): Promise<void> {
    const indexHtmlFile = assets["index.html"];
    if (!indexHtmlFile) {
      throw new Error(`${this.pluginName}: index.html not found in assets`);
    }

    const ssiTags = this.options.ssiTags || this.defaultSsiTags;
    const urls = [
      this.options.headerUrl,
      this.options.footerUrl,
      this.options.sidebarUrl,
    ];

    try {
      const responses = await Promise.all(
        urls.map((url) => this.fetchHtml(url))
      );

      let indexHtml = indexHtmlFile.source().toString();

      ssiTags.forEach((tag, i) => {
        indexHtml = indexHtml.replace(
          tag,
          responses[i] || `<!-- Failed to load content from ${urls[i]} -->`
        );
      });

      this.updateAsset(compilation, indexHtml);
    } catch (error) {
      throw new Error(
        `${this.pluginName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private updateAsset(compilation: Compilation, content: string): void {
    compilation.updateAsset("index.html", {
      source: () => content,
      size: () => content.length,
      map: () => ({
        version: 3,
        sources: [],
        names: [],
        mappings: "",
        file: "index.html",
      }),
      sourceAndMap: () => ({ source: content, map: {} }),
      updateHash: () => null,
      buffer: () => Buffer.from(content),
    });
  }

  private async fetchHtml(url: string): Promise<string> {
    try {
      const response = await axios.get<string>(url, {
        timeout: 5000, // 5 second timeout
        headers: {
          Accept: "text/html",
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch ${url}: ${error.message}`);
      }
      throw error;
    }
  }
}

export default SsiReplaceWebpackPlugin;
