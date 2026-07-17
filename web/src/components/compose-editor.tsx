"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export function ComposeEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string, text: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: html || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getText());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[280px] px-4 py-3 text-[var(--foreground)] outline-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && html && editor.getHTML() !== html) {
      editor.commands.setContent(html);
    }
  }, [editor, html]);

  return (
    <div className="rounded-md border border-[var(--card-border)] bg-[var(--mail-chrome)]">
      <div className="flex gap-1 border-b border-[var(--card-border)] px-2 py-1">
        <ToolbarButton
          label="B"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="• List"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs ${
        active
          ? "bg-[color-mix(in_srgb,var(--primary)_22%,transparent)] text-[var(--foreground)]"
          : "text-[var(--muted)] hover:bg-[var(--mail-list)]"
      }`}
    >
      {label}
    </button>
  );
}
