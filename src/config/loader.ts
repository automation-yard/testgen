import { cosmiconfig } from "cosmiconfig";
import { z } from "zod";
import { configSchema, defaultConfig, TestGenConfig } from "./schema";
import path from "path";

const CONFIG_MODULE_NAME = "testgen";

export class ConfigLoader {
  private explorer = cosmiconfig(CONFIG_MODULE_NAME, {
    searchPlaces: [
      "package.json",
      `.${CONFIG_MODULE_NAME}rc`,
      `.${CONFIG_MODULE_NAME}rc.json`,
      `.${CONFIG_MODULE_NAME}rc.js`,
      `.${CONFIG_MODULE_NAME}rc.cjs`,
      `${CONFIG_MODULE_NAME}.config.js`,
      `${CONFIG_MODULE_NAME}.config.cjs`,
    ],
  });

  async loadConfig(cwd = process.cwd()): Promise<TestGenConfig> {
    try {
      // Search for config file
      const result = await this.explorer.search(cwd);

      if (!result) {
        console.warn(
          "No configuration file found. Using default configuration."
        );
        return defaultConfig;
      }

      // Validate and merge with defaults
      const config = this.validateConfig(result.config);

      return {
        ...defaultConfig,
        ...config,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = this.formatZodError(error);
        throw new Error(`Invalid configuration:\n${formattedError}`);
      }

      throw new Error(
        `Failed to load configuration: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private validateConfig(config: unknown): TestGenConfig {
    return configSchema.parse(config);
  }

  private formatZodError(error: z.ZodError): string {
    return error.errors
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");
  }

  async initConfig(cwd = process.cwd()): Promise<void> {
    const configPath = path.join(cwd, `.${CONFIG_MODULE_NAME}rc.json`);
    const fs = await import("fs/promises");

    try {
      await fs.access(configPath);
      throw new Error("Configuration file already exists");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    const configContent = JSON.stringify(defaultConfig, null, 2);
    await fs.writeFile(configPath, configContent, "utf-8");
  }
}
