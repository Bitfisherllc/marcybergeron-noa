"use client";

import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import { useRef, type ReactNode } from "react";
import { Indent } from "@/lib/editorIndent";
import { isRichTextHtml, richTextElementClass } from "@/lib/richText";

function toEditorHtml(value: string): string {
  if (!value.trim()) return "";
  if (isRichTextHtml(value)) return value;
  return marked.parse(value, { async: false, breaks: true, gfm: true });
}

const sizeClass = {
  sm: "min-h-[6rem]",
  md: "min-h-[10rem]",
  lg: "min-h-[18rem]",
} as const;

type Props = {
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  /** Visible height of the writing area. */
  size?: keyof typeof sizeClass;
  /** Headings only make sense in long-form body text. */
  headings?: boolean;
  /** Accessible name when the editor is not inside a <label>. */
  ariaLabel?: string;
};

/** WYSIWYG field that submits HTML through a normal form field named `name`. */
export function AdminRichTextEditor({ name, defaultValue, required, size = "md", headings = false, ariaLabel }: Props) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: headings ? { levels: [2, 3] } : false,
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: null, target: null } },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Indent,
    ],
    content: toEditorHtml(defaultValue ?? ""),
    editorProps: {
      attributes: {
        class: `${sizeClass[size]} px-3 py-2 text-sm leading-relaxed text-ink outline-none [&>*+*]:mt-[0.75em] [&_h2]:text-2xl [&_h2]:mt-6 [&_h3]:text-xl [&_h3]:mt-5 ${richTextElementClass}`,
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
    },
    onUpdate({ editor: ed }) {
      const field = fieldRef.current;
      if (!field) return;
      field.value = ed.isEmpty ? "" : ed.getHTML().replace(/(<p><\/p>)+$/, "");
      field.dispatchEvent(new Event("input", { bubbles: true }));
    },
  });

  return (
    <div className="relative mt-2 border border-line bg-paper focus-within:border-ink/40">
      {editor ? <Toolbar editor={editor} headings={headings} /> : <div className="h-10 border-b border-line bg-white/70" />}
      <EditorContent editor={editor} />
      {/* Holds the original text until the first edit so untouched forms are not marked as changed. */}
      <textarea
        ref={fieldRef}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        tabIndex={-1}
        aria-hidden="true"
        onFocus={() => editor?.commands.focus()}
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full resize-none opacity-0"
      />
    </div>
  );
}

function Toolbar({ editor, headings }: { editor: Editor; headings: boolean }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      block: ed.isActive("heading", { level: 2 }) ? "h2" : ed.isActive("heading", { level: 3 }) ? "h3" : "p",
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      underline: ed.isActive("underline"),
      strike: ed.isActive("strike"),
      bulletList: ed.isActive("bulletList"),
      orderedList: ed.isActive("orderedList"),
      blockquote: ed.isActive("blockquote"),
      link: ed.isActive("link"),
      alignCenter: ed.isActive({ textAlign: "center" }),
      alignRight: ed.isActive({ textAlign: "right" }),
      canIndent: ed.can().indent(),
      canOutdent: ed.can().outdent(),
      canUndo: ed.can().undo(),
      canRedo: ed.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  function editLink() {
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (leave empty to remove the link)", current ?? "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed || trimmed === "https://") {
      chain().extendMarkRange("link").unsetLink().run();
      return;
    }
    chain().extendMarkRange("link").setLink({ href: trimmed }).run();
  }

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="sticky top-[var(--admin-sticky-top,57px)] z-10 flex flex-wrap items-center gap-1 border-b border-line bg-white/90 px-2 py-1.5 backdrop-blur"
    >
      {headings ? (
        <select
          aria-label="Text style"
          value={state.block}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") chain().setParagraph().run();
            else chain().setHeading({ level: v === "h2" ? 2 : 3 }).run();
          }}
          className="mr-1 h-8 border border-line bg-paper px-2 text-xs text-ink"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
        </select>
      ) : null}
      <ToolButton label="Bold (⌘B)" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolButton>
      <ToolButton label="Italic (⌘I)" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <span className="font-serif italic">I</span>
      </ToolButton>
      <ToolButton label="Underline (⌘U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
        <span className="underline">U</span>
      </ToolButton>
      <ToolButton label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <span className="line-through">S</span>
      </ToolButton>
      <Divider />
      <ToolButton label="Bulleted list" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
        <Icon d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
      </ToolButton>
      <ToolButton label="Numbered list" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
        <Icon d="M10 6h10M10 12h10M10 18h10M4 4.5h1.5V9M4 9h3M4 14.5c.4-.6 1-.9 1.6-.9.8 0 1.4.5 1.4 1.2 0 1.2-3 2-3 3.7h3" />
      </ToolButton>
      <ToolButton label="Quote" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
        <Icon d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6" />
      </ToolButton>
      <ToolButton label="Decrease indent (⌘[)" disabled={!state.canOutdent} onClick={() => chain().outdent().run()}>
        <Icon d="M4 5h16M11 10h9M11 14h9M4 19h16M7.5 9.5 4.5 12l3 2.5" />
      </ToolButton>
      <ToolButton label="Increase indent (⌘])" disabled={!state.canIndent} onClick={() => chain().indent().run()}>
        <Icon d="M4 5h16M11 10h9M11 14h9M4 19h16M4.5 9.5l3 2.5-3 2.5" />
      </ToolButton>
      <Divider />
      <ToolButton
        label="Align left"
        active={!state.alignCenter && !state.alignRight}
        onClick={() => chain().setTextAlign("left").run()}
      >
        <Icon d="M4 6h16M4 10h10M4 14h16M4 18h10" />
      </ToolButton>
      <ToolButton label="Center" active={state.alignCenter} onClick={() => chain().setTextAlign("center").run()}>
        <Icon d="M4 6h16M7 10h10M4 14h16M7 18h10" />
      </ToolButton>
      <ToolButton label="Align right" active={state.alignRight} onClick={() => chain().setTextAlign("right").run()}>
        <Icon d="M4 6h16M10 10h10M4 14h16M10 18h10" />
      </ToolButton>
      <Divider />
      <ToolButton label="Add or edit link" active={state.link} onClick={editLink}>
        <Icon d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
      </ToolButton>
      <ToolButton label="Horizontal line" onClick={() => chain().setHorizontalRule().run()}>
        <Icon d="M4 12h16" />
      </ToolButton>
      <ToolButton label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().unsetTextAlign().unsetIndent().run()}>
        <Icon d="M6 6h12M12 6l-3 12M15 15l5 5M20 15l-5 5" />
      </ToolButton>
      <Divider />
      <ToolButton label="Undo (⌘Z)" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
        <Icon d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
      </ToolButton>
      <ToolButton label="Redo (⇧⌘Z)" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
        <Icon d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center px-1.5 text-sm transition focus-ring disabled:opacity-30 ${
        active ? "bg-ink text-paper" : "text-ink hover:bg-ink/10"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
