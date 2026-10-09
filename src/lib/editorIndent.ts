import { Extension, type CommandProps } from "@tiptap/react";

const INDENT_TYPES = ["paragraph", "heading"];
/** Deeper levels squeeze text into a thin column on phones. */
const MAX_INDENT = 4;
/** Each level is stored inline so the public pages render it without extra CSS. */
const INDENT_STEP_EM = 2;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
      unsetIndent: () => ReturnType;
    };
  }
}

function clampIndent(value: number): number {
  return Math.max(0, Math.min(MAX_INDENT, Math.round(value)));
}

/** Shifts the selected paragraphs/headings; list paragraphs move with their list item instead. */
function shiftBlocks({ state, tr, dispatch }: CommandProps, next: (level: number) => number): boolean {
  const { from, to } = state.selection;
  let changed = false;
  state.doc.nodesBetween(from, to, (node, pos, parent) => {
    if (!INDENT_TYPES.includes(node.type.name)) return;
    if (parent?.type.name === "listItem") return false;
    const current = Number(node.attrs.indent) || 0;
    const level = clampIndent(next(current));
    if (level === current) return false;
    if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: level });
    changed = true;
    return false;
  });
  return changed;
}

/** Indent / outdent for the admin editor: nests list items, otherwise adds a left margin to the block. */
export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: INDENT_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => clampIndent(Number(element.getAttribute("data-indent")) || 0),
            renderHTML: (attributes) => {
              const level = Number(attributes.indent) || 0;
              if (level <= 0) return {};
              return { "data-indent": level, style: `margin-left: ${level * INDENT_STEP_EM}em` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        (props) =>
          props.editor.isActive("listItem")
            ? props.commands.sinkListItem("listItem")
            : shiftBlocks(props, (level) => level + 1),
      outdent:
        () =>
        (props) =>
          props.editor.isActive("listItem")
            ? props.commands.liftListItem("listItem")
            : shiftBlocks(props, (level) => level - 1),
      unsetIndent: () => (props) => shiftBlocks(props, () => 0),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-]": () => this.editor.commands.indent(),
      "Mod-[": () => this.editor.commands.outdent(),
    };
  },
});
