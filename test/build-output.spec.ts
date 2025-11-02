import { existsSync, statSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

describe("Build Output Validation", () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const rootDir = join(__dirname, "..");

  // Load package.json
  const pkgPath = join(rootDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

  const expectedFiles = [
    "index.js",
    "index.d.ts",
    "index.js.map",
    "index.d.ts.map",
    "crypt.js",
    "crypt.d.ts",
    "crypt.js.map",
    "crypt.d.ts.map",
    "stealth/index.js",
    "stealth/index.d.ts",
    "stealth/index.js.map",
    "stealth/index.d.ts.map",
    "stealth/elliptic.js",
    "stealth/elliptic.d.ts",
    "stealth/elliptic.js.map",
    "stealth/elliptic.d.ts.map",
    "stealth/stealth.js",
    "stealth/stealth.d.ts",
    "stealth/stealth.js.map",
    "stealth/stealth.d.ts.map",
  ];

  describe("File Structure", () => {
    it("should have all expected build output files (run 'npm run build' first)", () => {
      const missingFiles: string[] = [];

      expectedFiles.forEach((file) => {
        const filePath = join(rootDir, file);
        if (!existsSync(filePath)) {
          missingFiles.push(file);
        }
      });

      if (missingFiles.length > 0) {
        console.warn(
          `⚠️  Missing build files. Run 'npm run build' first.\nMissing: ${missingFiles.join(", ")}`,
        );
      }

      expect(missingFiles).toEqual([]);
    });

    it("should have non-empty JavaScript files", () => {
      const jsFiles = expectedFiles.filter((f) => f.endsWith(".js"));

      jsFiles.forEach((file) => {
        const filePath = join(rootDir, file);
        const stats = statSync(filePath);
        expect(stats.size).toBeGreaterThan(0);
      });
    });

    it("should have TypeScript declaration files", () => {
      const dtsFiles = expectedFiles.filter((f) => f.endsWith(".d.ts"));

      dtsFiles.forEach((file) => {
        const filePath = join(rootDir, file);
        expect(existsSync(filePath)).toBe(true);
      });
    });

    it("should have source maps", () => {
      const mapFiles = expectedFiles.filter((f) => f.endsWith(".map"));

      mapFiles.forEach((file) => {
        const filePath = join(rootDir, file);
        expect(existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Package Exports", () => {
    it("should not have cjs or esm directories", () => {
      expect(existsSync(join(rootDir, "cjs"))).toBe(false);
      expect(existsSync(join(rootDir, "esm"))).toBe(false);
    });

    it("should match package.json files configuration", () => {
      const declaredFiles = pkg.files || [];

      expect(declaredFiles).toContain("*.js");
      expect(declaredFiles).toContain("*.d.ts");
      expect(declaredFiles).toContain("*.js.map");
      expect(declaredFiles).toContain("*.d.ts.map");
      expect(declaredFiles).toContain("stealth/");
    });
  });

  describe("ESM Format Validation", () => {
    it("should have package.json with type: module", () => {
      expect(pkg.type).toBe("module");
    });

    it("should have proper exports configuration", () => {
      expect(pkg.exports).toBeDefined();
      expect(pkg.exports["."]).toBe("./index.js");
      expect(pkg.exports["./crypt.js"]).toBe("./crypt.js");
      expect(pkg.exports["./stealth.js"]).toBe("./stealth/index.js");
    });

    it("main entry point should be index.js", () => {
      expect(pkg.main).toBe("index.js");
      expect(pkg.module).toBe("index.js");
    });

    it("should have types pointing to index.d.ts", () => {
      expect(pkg.types).toBe("index.d.ts");
    });
  });
});
