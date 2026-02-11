export interface OutlineNode {
  key: string;
  line: number;
  children: OutlineNode[];
}

function parseYaml(content: string): OutlineNode[] {
  const lines = content.split("\n");
  const root: OutlineNode[] = [];
  const stack: { node: OutlineNode; indent: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const match = raw.match(/^(\s*)([\w][\w.*-]*)\s*:/);
    if (!match) continue;

    const indent = match[1].length;
    const node: OutlineNode = { key: match[2], line: i + 1, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ node, indent });
  }

  return root;
}

function parseJson(content: string): OutlineNode[] {
  const lines = content.split("\n");
  const root: OutlineNode[] = [];
  const stack: { node: OutlineNode; depth: number }[] = [];
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    for (const ch of raw) {
      if (ch === "{" || ch === "[") depth++;
    }

    const match = raw.match(/^\s*"([\w][\w.*-]*)"\s*:/);
    if (match) {
      const node: OutlineNode = { key: match[1], line: i + 1, children: [] };

      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(node);
      } else {
        stack[stack.length - 1].node.children.push(node);
      }

      const hasObject = raw.includes("{") || raw.includes("[");
      if (hasObject) {
        stack.push({ node, depth });
      }
    }

    for (const ch of raw) {
      if (ch === "}" || ch === "]") depth--;
    }
  }

  return root;
}

function parseGeneric(content: string): OutlineNode[] {
  const lines = content.split("\n");
  const nodes: OutlineNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const match = raw.match(
      /^\s*(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|enum|const|def|fn|pub\s+fn|func)\s+([\w]+)/
    );
    if (match) {
      nodes.push({ key: match[1], line: i + 1, children: [] });
    }
  }

  return nodes;
}

export function parseStructure(content: string, language: string): OutlineNode[] {
  if (language === "yaml") return parseYaml(content);
  if (language === "json" || language === "jsonc") return parseJson(content);
  return parseGeneric(content);
}
