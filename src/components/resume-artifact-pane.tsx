"use client";

import {
  Check,
  ChevronDown,
  Code2,
  Download,
  Eye,
  FileCode2,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { MarkdownSourceEditor } from "@/components/markdown-source-editor";
import { ResumePreview } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAMED_SECTIONS, type TemplateId } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ArtifactMode = "preview" | "source";
export type SaveStatus = "idle" | "saving" | "saved";

export function ResumeArtifactPane({
  mode,
  onModeChange,
  body,
  onBodyChange,
  templateId,
  onTemplateChange,
  hasRevision,
  restoring,
  onRestore,
  exportingFormat,
  onExport,
  saveStatus,
  aiSyncing = false,
}: {
  mode: ArtifactMode;
  onModeChange: (mode: ArtifactMode) => void;
  body: string;
  onBodyChange: (body: string) => void;
  templateId: TemplateId;
  onTemplateChange: (templateId: TemplateId) => void;
  hasRevision: boolean;
  restoring: boolean;
  onRestore: () => void;
  exportingFormat: "pdf" | "docx" | null;
  onExport: (format: "pdf" | "docx") => void;
  saveStatus: SaveStatus;
  aiSyncing?: boolean;
}) {
  function insertSectionHeading(sectionName: string) {
    const heading = `## ${sectionName}\n`;
    if (body.includes(`## ${sectionName}`)) return;
    const prefix =
      body.trim().length === 0 ? "" : `${body.replace(/\s+$/, "")}\n\n`;
    onBodyChange(`${prefix}${heading}`);
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F6F7FB]">
      {/* 右栏合一顶栏：左侧 [预览 | 源码] 开关切换 + 右侧模板/修订/导出 */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#E7E9F3] bg-white px-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            role="radiogroup"
            aria-label="简历显示模式切换"
            className="flex rounded-xl border border-[#E7E9F3] bg-[#F6F7FB] p-0.5"
          >
            <button
              type="button"
              role="radio"
              aria-checked={mode === "preview"}
              onClick={() => onModeChange("preview")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5A6ACF]/40",
                mode === "preview"
                  ? "bg-white text-[#5A6ACF] shadow-2xs"
                  : "text-[#565A78] hover:text-[#14152B]",
              )}
            >
              <Eye className="size-3.5" />
              <span>预览</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === "source"}
              onClick={() => onModeChange("source")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5A6ACF]/40",
                mode === "source"
                  ? "bg-white text-[#5A6ACF] shadow-2xs"
                  : "text-[#565A78] hover:text-[#14152B]",
              )}
            >
              <Code2 className="size-3.5" />
              <span>Markdown</span>
            </button>
          </div>

          {aiSyncing ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-[#EEF0FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#5A6ACF] sm:inline-flex">
              <Loader2 className="size-3 animate-spin" />
              AI 同步中…
            </span>
          ) : saveStatus === "saving" ? (
            <span className="hidden items-center gap-1 text-[11px] text-[#8C8FA8] sm:inline-flex">
              <Loader2 className="size-3 animate-spin" />
              保存中…
            </span>
          ) : saveStatus === "saved" ? (
            <span className="hidden items-center gap-1 text-[11px] text-[#027A48] sm:inline-flex">
              <Check className="size-3 text-[#12B76A]" />
              已保存
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* 单栏 / 双栏模板切换 */}
          <select
            aria-label="简历排版模板"
            className="h-8 rounded-lg border border-[#E7E9F3] bg-white px-2.5 text-[12px] font-medium text-[#14152B] outline-none focus-visible:border-[#5A6ACF]"
            value={templateId}
            onChange={(event) =>
              onTemplateChange(event.target.value as TemplateId)
            }
          >
            <option value="single">单栏模板</option>
            <option value="double">双栏模板</option>
          </select>

          {/* 恢复上一版 AI 修订 */}
          {hasRevision ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg bg-white px-2.5 text-[12px]"
              onClick={onRestore}
              disabled={restoring}
              title="恢复到 AI 改写前的上一版正文"
            >
              {restoring ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              <span className="hidden sm:inline">恢复修订</span>
            </Button>
          ) : null}

          {/* 导出 PDF / Word 下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exportingFormat !== null}
                  className="h-8 gap-1 rounded-lg bg-white px-2.5 text-[12px]"
                />
              }
            >
              {exportingFormat !== null ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-[#5A6ACF]" />
                  <span>导出中…</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  <span>导出</span>
                  <ChevronDown className="size-3 text-[#8C8FA8]" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-40 rounded-xl border border-[#E7E9F3] bg-white p-1 shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => onExport("pdf")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-[#14152B]"
              >
                <FileText className="size-3.5 text-[#5A6ACF]" />
                导出 PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExport("docx")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-[#14152B]"
              >
                <FileCode2 className="size-3.5 text-[#5A6ACF]" />
                导出 Word (.docx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 内容视图：预览 or Markdown 源码 */}
      {mode === "preview" ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ResumePreview
            body={body}
            templateId={templateId}
            aiSyncing={aiSyncing}
            onSwitchToSource={() => onModeChange("source")}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          {/* 源码模式快捷章节插入条 */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F2F8] bg-[#FAFBFF] px-4 py-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[11px] font-medium text-[#8C8FA8]">
                快捷插入章节：
              </span>
              {NAMED_SECTIONS.map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => insertSectionHeading(section)}
                  className="rounded-md border border-[#E7E9F3] bg-white px-2 py-0.5 text-[11px] font-medium text-[#565A78] transition-colors hover:border-[#5A6ACF]/40 hover:bg-[#EEF0FF] hover:text-[#5A6ACF]"
                >
                  + {section}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#8C8FA8]">
              <Sparkles className="size-3 text-[#5A6ACF]" />
              实时自动保存
            </span>
          </div>

          <MarkdownSourceEditor value={body} onChange={onBodyChange} />

          {/* 底部轻量编辑器状态栏 */}
          <div className="flex h-7 shrink-0 items-center justify-between border-t border-[#F1F2F8] bg-[#FAFBFF] px-4 text-[11px] text-[#8C8FA8]">
            <span>
              {body ? body.split("\n").length : 0} 行 · {body.length} 字符
            </span>
            <span>Markdown · CodeMirror</span>
          </div>
        </div>
      )}
    </div>
  );
}
