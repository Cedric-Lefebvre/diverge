import { describe, it, expect } from "vitest";
import { parseStructure, type OutlineNode } from "./structureParser";

function keys(nodes: OutlineNode[]): string[] {
  return nodes.map((n) => n.key);
}

function childKeys(nodes: OutlineNode[], parentKey: string): string[] {
  const parent = nodes.find((n) => n.key === parentKey);
  return parent ? parent.children.map((c) => c.key) : [];
}

describe("parseStructure", () => {
  describe("YAML", () => {
    it("parses top-level keys", () => {
      const yaml = `name: app\nversion: 1.0\ndescription: test`;
      const result = parseStructure(yaml, "yaml");
      expect(keys(result)).toEqual(["name", "version", "description"]);
    });

    it("tracks correct line numbers", () => {
      const yaml = `first: 1\nsecond: 2\nthird: 3`;
      const result = parseStructure(yaml, "yaml");
      expect(result[0].line).toBe(1);
      expect(result[1].line).toBe(2);
      expect(result[2].line).toBe(3);
    });

    it("builds hierarchy from indentation", () => {
      const yaml = [
        "server:",
        "  host: localhost",
        "  port: 8080",
        "database:",
        "  connection: pg",
      ].join("\n");
      const result = parseStructure(yaml, "yaml");
      expect(keys(result)).toEqual(["server", "database"]);
      expect(childKeys(result, "server")).toEqual(["host", "port"]);
      expect(childKeys(result, "database")).toEqual(["connection"]);
    });

    it("handles deeply nested structures", () => {
      const yaml = [
        "a:",
        "  b:",
        "    c:",
        "      d: value",
      ].join("\n");
      const result = parseStructure(yaml, "yaml");
      expect(result.length).toBe(1);
      expect(result[0].key).toBe("a");
      expect(result[0].children[0].key).toBe("b");
      expect(result[0].children[0].children[0].key).toBe("c");
      expect(result[0].children[0].children[0].children[0].key).toBe("d");
    });

    it("handles keys with dots and dashes", () => {
      const yaml = `my-service.v2: true\nanother.key: false`;
      const result = parseStructure(yaml, "yaml");
      expect(keys(result)).toEqual(["my-service.v2", "another.key"]);
    });

    it("skips comment-only and blank lines", () => {
      const yaml = `# comment\nname: test\n\n# another\nversion: 1`;
      const result = parseStructure(yaml, "yaml");
      expect(keys(result)).toEqual(["name", "version"]);
    });

    it("returns empty for empty content", () => {
      expect(parseStructure("", "yaml")).toEqual([]);
    });

    it("handles sibling keys after nested block", () => {
      const yaml = [
        "a:",
        "  x: 1",
        "  y: 2",
        "b:",
        "  z: 3",
      ].join("\n");
      const result = parseStructure(yaml, "yaml");
      expect(keys(result)).toEqual(["a", "b"]);
      expect(childKeys(result, "a")).toEqual(["x", "y"]);
      expect(childKeys(result, "b")).toEqual(["z"]);
    });
  });

  describe("JSON", () => {
    it("parses top-level keys", () => {
      const json = `{\n  "name": "app",\n  "version": "1.0"\n}`;
      const result = parseStructure(json, "json");
      expect(keys(result)).toEqual(["name", "version"]);
    });

    it("tracks correct line numbers", () => {
      const json = `{\n  "first": 1,\n  "second": 2\n}`;
      const result = parseStructure(json, "json");
      expect(result[0].line).toBe(2);
      expect(result[1].line).toBe(3);
    });

    it("nests keys inside objects", () => {
      const json = [
        "{",
        '  "server": {',
        '    "host": "localhost",',
        '    "port": 8080',
        "  },",
        '  "db": "pg"',
        "}",
      ].join("\n");
      const result = parseStructure(json, "json");
      // server is top-level, host/port are inside it
      const serverNode = result.find((n) => n.key === "server");
      expect(serverNode).toBeDefined();
      expect(result.find((n) => n.key === "db")).toBeDefined();
    });

    it("handles arrays with objects", () => {
      const json = [
        "{",
        '  "items": [',
        "    {",
        '      "id": 1',
        "    }",
        "  ]",
        "}",
      ].join("\n");
      const result = parseStructure(json, "json");
      expect(keys(result)).toEqual(["items"]);
    });

    it("returns empty for empty object", () => {
      expect(parseStructure("{}", "json")).toEqual([]);
    });

    it("works with jsonc language", () => {
      const jsonc = `{\n  // comment\n  "key": "value"\n}`;
      const result = parseStructure(jsonc, "jsonc");
      expect(keys(result)).toEqual(["key"]);
    });
  });

  describe("generic (code files)", () => {
    it("detects function declarations", () => {
      const code = `function hello() {\n  return 1;\n}\n\nfunction world() {\n  return 2;\n}`;
      const result = parseStructure(code, "typescript");
      expect(keys(result)).toEqual(["hello", "world"]);
    });

    it("detects export function", () => {
      const code = `export function parseData() {}`;
      const result = parseStructure(code, "typescript");
      expect(keys(result)).toEqual(["parseData"]);
    });

    it("detects async function", () => {
      const code = `async function fetchData() {}`;
      const result = parseStructure(code, "javascript");
      expect(keys(result)).toEqual(["fetchData"]);
    });

    it("detects export async function", () => {
      const code = `export async function fetchData() {}`;
      const result = parseStructure(code, "typescript");
      expect(keys(result)).toEqual(["fetchData"]);
    });

    it("detects class declarations", () => {
      const code = `class MyClass {\n  constructor() {}\n}`;
      const result = parseStructure(code, "typescript");
      expect(keys(result)).toEqual(["MyClass"]);
    });

    it("detects interface and type", () => {
      const code = `interface Foo {\n  bar: string;\n}\n\ntype Baz = string;`;
      const result = parseStructure(code, "typescript");
      expect(keys(result)).toEqual(["Foo", "Baz"]);
    });

    it("detects enum", () => {
      const code = `enum Color {\n  Red,\n  Green,\n  Blue\n}`;
      const result = parseStructure(code, "typescript");
      expect(keys(result)).toEqual(["Color"]);
    });

    it("detects const", () => {
      const code = `const MAX_SIZE = 100;`;
      const result = parseStructure(code, "typescript");
      expect(keys(result)).toEqual(["MAX_SIZE"]);
    });

    it("detects Python def", () => {
      const code = `def hello():\n    pass\n\ndef world():\n    pass`;
      const result = parseStructure(code, "python");
      expect(keys(result)).toEqual(["hello", "world"]);
    });

    it("detects Rust fn and pub fn", () => {
      const code = `fn private_fn() {}\n\npub fn public_fn() {}`;
      const result = parseStructure(code, "rust");
      expect(keys(result)).toEqual(["private_fn", "public_fn"]);
    });

    it("detects Go func", () => {
      const code = `func main() {\n}\n\nfunc helper() {\n}`;
      const result = parseStructure(code, "go");
      expect(keys(result)).toEqual(["main", "helper"]);
    });

    it("tracks correct line numbers for generic", () => {
      const code = `\n\nfunction third() {}`;
      const result = parseStructure(code, "javascript");
      expect(result[0].line).toBe(3);
    });

    it("generic nodes have empty children", () => {
      const code = `function foo() {}`;
      const result = parseStructure(code, "javascript");
      expect(result[0].children).toEqual([]);
    });

    it("returns empty for no declarations", () => {
      const code = `// just a comment\nlet x = 1 + 2;`;
      const result = parseStructure(code, "javascript");
      expect(result).toEqual([]);
    });
  });

  describe("language routing", () => {
    it("routes yaml to YAML parser", () => {
      const yaml = `key: value`;
      const result = parseStructure(yaml, "yaml");
      expect(result.length).toBe(1);
      expect(result[0].key).toBe("key");
    });

    it("routes json to JSON parser", () => {
      const json = `{\n  "key": "value"\n}`;
      const result = parseStructure(json, "json");
      expect(result.length).toBe(1);
      expect(result[0].key).toBe("key");
    });

    it("routes jsonc to JSON parser", () => {
      const json = `{\n  "key": "value"\n}`;
      const result = parseStructure(json, "jsonc");
      expect(result.length).toBe(1);
      expect(result[0].key).toBe("key");
    });

    it("routes other languages to generic parser", () => {
      const code = `function test() {}`;
      const result = parseStructure(code, "python");
      // generic parser won't pick up "function" as Python def
      // but will match function keyword
      expect(result.length).toBe(1);
    });
  });
});
