import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { OutlineNode } from "../utils/structureParser";

interface OutlineModalProps {
  nodes: OutlineNode[];
  onJump: (line: number) => void;
  onClose: () => void;
}

function flattenNodes(nodes: OutlineNode[], depth: number = 0): { node: OutlineNode; depth: number; path: string }[] {
  const result: { node: OutlineNode; depth: number; path: string }[] = [];
  for (const node of nodes) {
    result.push({ node, depth, path: node.key });
    result.push(...flattenNodes(node.children, depth + 1));
  }
  return result;
}

export function OutlineModal({ nodes, onJump, onClose }: OutlineModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allItems = useMemo(() => flattenNodes(nodes), [nodes]);

  const filteredItems = useMemo(() => {
    if (!query) return allItems;
    const q = query.toLowerCase();
    return allItems.filter((item) => item.node.key.toLowerCase().includes(q));
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const handleSelect = useCallback(
    (idx: number) => {
      const item = filteredItems[idx];
      if (item) {
        onJump(item.node.line);
        onClose();
      }
    },
    [filteredItems, onJump, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIdx);
    }
  };

  return (
    <div className="outline-overlay" onClick={onClose}>
      <div className="outline-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="outline-search">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to symbol..."
            spellCheck={false}
          />
        </div>

        <div className="outline-list" ref={listRef}>
          {filteredItems.length === 0 && (
            <div className="outline-empty">No symbols found</div>
          )}
          {filteredItems.map((item, i) => (
            <div
              key={`${item.node.key}-${item.node.line}`}
              className={`outline-item ${i === selectedIdx ? "selected" : ""}`}
              style={{ paddingLeft: 12 + item.depth * 16 }}
              onClick={() => handleSelect(i)}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span className="outline-item-icon">
                {item.node.children.length > 0 ? "◆" : "◇"}
              </span>
              <span className="outline-item-key">{item.node.key}</span>
              <span className="outline-item-line">:{item.node.line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
