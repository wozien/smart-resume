"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { MonthPicker } from "@/components/month-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  EMPTY_OVERVIEW,
  newEducationItem,
  newProjectItem,
  newWorkItem,
} from "@/lib/resume-overview";
import type {
  ResumeOverview,
  ResumeOverviewBasics,
  ResumeOverviewEducationItem,
  ResumeOverviewProjectItem,
  ResumeOverviewWorkItem,
} from "@/lib/types";

const QUERY_KEY = ["resume-overview"] as const;

export function ResumeOverviewPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api<ResumeOverview>("/api/me/resume-overview"),
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<ResumeOverview>) => {
      const current =
        queryClient.getQueryData<ResumeOverview>(QUERY_KEY) ?? EMPTY_OVERVIEW;
      return api<ResumeOverview>("/api/me/resume-overview", {
        method: "PUT",
        body: JSON.stringify({ ...current, ...patch }),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
      toast.success("已保存");
    },
    onError: (err) => toast.error(err.message),
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-label="正在加载简历概况">
        {[0, 1, 2].map((index) => (
          <section
            key={index}
            className="rounded-2xl border border-[#E7E9F3] bg-white p-6"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-3.5 w-56" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-10 w-20 rounded-lg" />
          </section>
        ))}
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <p className="text-sm text-[#B42318]">概况加载失败，请刷新重试。</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <BasicsSection
        initial={query.data.basics}
        saving={save.isPending}
        onSave={(basics) => save.mutate({ basics })}
      />
      <WorkSection
        initial={query.data.work}
        saving={save.isPending}
        onSave={(work) => save.mutate({ work })}
      />
      <ProjectSection
        initial={query.data.projects}
        saving={save.isPending}
        onSave={(projects) => save.mutate({ projects })}
      />
      <EducationSection
        initial={query.data.education}
        saving={save.isPending}
        onSave={(education) => save.mutate({ education })}
      />
      <SkillsSection
        initial={query.data.skills}
        saving={save.isPending}
        onSave={(skills) => save.mutate({ skills })}
      />
      <SummarySection
        initial={query.data.summary}
        saving={save.isPending}
        onSave={(summary) => save.mutate({ summary })}
      />
    </div>
  );
}

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {hint ? <p className="mt-1 text-[13px] text-[#8C8FA8]">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function DatePair({
  startId,
  endId,
  start,
  end,
  onStart,
  onEnd,
}: {
  startId: string;
  endId: string;
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field id={startId} label="开始">
        <MonthPicker id={startId} value={start} onChange={onStart} placeholder="选择月份" />
      </Field>
      <Field id={endId} label="结束">
        <MonthPicker
          id={endId}
          value={end}
          onChange={onEnd}
          allowPresent
          placeholder="至今"
        />
      </Field>
    </div>
  );
}

function SaveButton({
  saving,
  onClick,
}: {
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      className="h-10 bg-[#5A6ACF] hover:bg-[#4f5dbb]"
      disabled={saving}
      onClick={onClick}
    >
      {saving ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          保存中…
        </>
      ) : (
        "保存"
      )}
    </Button>
  );
}

function BasicsSection({
  initial,
  saving,
  onSave,
}: {
  initial: ResumeOverviewBasics;
  saving: boolean;
  onSave: (value: ResumeOverviewBasics) => void;
}) {
  const [form, setForm] = useState(initial);

  return (
    <SectionCard title="基本信息" hint="用户级联系字段，不等于各份简历的文首。">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="overview-name" label="姓名">
          <Input
            id="overview-name"
            className="h-11"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <Field id="overview-phone" label="电话">
          <Input
            id="overview-phone"
            className="h-11"
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
          />
        </Field>
        <Field id="overview-email" label="邮箱">
          <Input
            id="overview-email"
            className="h-11"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
          />
        </Field>
        <Field id="overview-city" label="所在地">
          <Input
            id="overview-city"
            className="h-11"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
          />
        </Field>
      </div>
      <div className="mt-4">
        <SaveButton saving={saving} onClick={() => onSave(form)} />
      </div>
    </SectionCard>
  );
}

function WorkSection({
  initial,
  saving,
  onSave,
}: {
  initial: ResumeOverviewWorkItem[];
  saving: boolean;
  onSave: (value: ResumeOverviewWorkItem[]) => void;
}) {
  const [items, setItems] = useState(initial);

  function update(id: string, patch: Partial<ResumeOverviewWorkItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <SectionCard title="工作经历">
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-[13px] text-[#8C8FA8]">还没有工作经历。</p>
        ) : null}
        {items.map((item, index) => (
          <div
            key={item.id}
            className="space-y-4 rounded-xl border border-[#E7E9F3] bg-[#FAFBFF] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#565A78]">
                工作 {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={`删除工作 ${index + 1}`}
                onClick={() =>
                  setItems((current) =>
                    current.filter((row) => row.id !== item.id),
                  )
                }
              >
                <Trash2 className="size-4 text-[#B42318]" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`work-company-${item.id}`} label="公司">
                <Input
                  id={`work-company-${item.id}`}
                  className="h-11 bg-white"
                  value={item.company}
                  onChange={(event) =>
                    update(item.id, { company: event.target.value })
                  }
                />
              </Field>
              <Field id={`work-title-${item.id}`} label="职位">
                <Input
                  id={`work-title-${item.id}`}
                  className="h-11 bg-white"
                  value={item.title}
                  onChange={(event) =>
                    update(item.id, { title: event.target.value })
                  }
                />
              </Field>
            </div>
            <DatePair
              startId={`work-start-${item.id}`}
              endId={`work-end-${item.id}`}
              start={item.startDate}
              end={item.endDate}
              onStart={(startDate) => update(item.id, { startDate })}
              onEnd={(endDate) => update(item.id, { endDate })}
            />
            <Field id={`work-desc-${item.id}`} label="职责描述">
              <Textarea
                id={`work-desc-${item.id}`}
                className="min-h-24 bg-white"
                value={item.description}
                onChange={(event) =>
                  update(item.id, { description: event.target.value })
                }
              />
            </Field>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-white hover:bg-white"
            onClick={() => setItems((current) => [...current, newWorkItem()])}
          >
            <Plus />
            添加工作经历
          </Button>
          <SaveButton saving={saving} onClick={() => onSave(items)} />
        </div>
      </div>
    </SectionCard>
  );
}

function ProjectSection({
  initial,
  saving,
  onSave,
}: {
  initial: ResumeOverviewProjectItem[];
  saving: boolean;
  onSave: (value: ResumeOverviewProjectItem[]) => void;
}) {
  const [items, setItems] = useState(initial);

  function update(id: string, patch: Partial<ResumeOverviewProjectItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <SectionCard title="项目经历">
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-[13px] text-[#8C8FA8]">还没有项目经历。</p>
        ) : null}
        {items.map((item, index) => (
          <div
            key={item.id}
            className="space-y-4 rounded-xl border border-[#E7E9F3] bg-[#FAFBFF] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#565A78]">
                项目 {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={`删除项目 ${index + 1}`}
                onClick={() =>
                  setItems((current) =>
                    current.filter((row) => row.id !== item.id),
                  )
                }
              >
                <Trash2 className="size-4 text-[#B42318]" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`project-name-${item.id}`} label="名称">
                <Input
                  id={`project-name-${item.id}`}
                  className="h-11 bg-white"
                  value={item.name}
                  onChange={(event) =>
                    update(item.id, { name: event.target.value })
                  }
                />
              </Field>
              <Field id={`project-role-${item.id}`} label="角色">
                <Input
                  id={`project-role-${item.id}`}
                  className="h-11 bg-white"
                  value={item.role}
                  onChange={(event) =>
                    update(item.id, { role: event.target.value })
                  }
                />
              </Field>
            </div>
            <DatePair
              startId={`project-start-${item.id}`}
              endId={`project-end-${item.id}`}
              start={item.startDate}
              end={item.endDate}
              onStart={(startDate) => update(item.id, { startDate })}
              onEnd={(endDate) => update(item.id, { endDate })}
            />
            <Field id={`project-desc-${item.id}`} label="描述">
              <Textarea
                id={`project-desc-${item.id}`}
                className="min-h-24 bg-white"
                value={item.description}
                onChange={(event) =>
                  update(item.id, { description: event.target.value })
                }
              />
            </Field>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-white hover:bg-white"
            onClick={() =>
              setItems((current) => [...current, newProjectItem()])
            }
          >
            <Plus />
            添加项目经历
          </Button>
          <SaveButton saving={saving} onClick={() => onSave(items)} />
        </div>
      </div>
    </SectionCard>
  );
}

function EducationSection({
  initial,
  saving,
  onSave,
}: {
  initial: ResumeOverviewEducationItem[];
  saving: boolean;
  onSave: (value: ResumeOverviewEducationItem[]) => void;
}) {
  const [items, setItems] = useState(initial);

  function update(id: string, patch: Partial<ResumeOverviewEducationItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <SectionCard title="教育经历">
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-[13px] text-[#8C8FA8]">还没有教育经历。</p>
        ) : null}
        {items.map((item, index) => (
          <div
            key={item.id}
            className="space-y-4 rounded-xl border border-[#E7E9F3] bg-[#FAFBFF] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#565A78]">
                教育 {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={`删除教育 ${index + 1}`}
                onClick={() =>
                  setItems((current) =>
                    current.filter((row) => row.id !== item.id),
                  )
                }
              >
                <Trash2 className="size-4 text-[#B42318]" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`edu-school-${item.id}`} label="学校">
                <Input
                  id={`edu-school-${item.id}`}
                  className="h-11 bg-white"
                  value={item.school}
                  onChange={(event) =>
                    update(item.id, { school: event.target.value })
                  }
                />
              </Field>
              <Field id={`edu-degree-${item.id}`} label="学历">
                <Input
                  id={`edu-degree-${item.id}`}
                  className="h-11 bg-white"
                  value={item.degree}
                  onChange={(event) =>
                    update(item.id, { degree: event.target.value })
                  }
                />
              </Field>
              <Field id={`edu-major-${item.id}`} label="专业">
                <Input
                  id={`edu-major-${item.id}`}
                  className="h-11 bg-white"
                  value={item.major}
                  onChange={(event) =>
                    update(item.id, { major: event.target.value })
                  }
                />
              </Field>
            </div>
            <DatePair
              startId={`edu-start-${item.id}`}
              endId={`edu-end-${item.id}`}
              start={item.startDate}
              end={item.endDate}
              onStart={(startDate) => update(item.id, { startDate })}
              onEnd={(endDate) => update(item.id, { endDate })}
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-white hover:bg-white"
            onClick={() =>
              setItems((current) => [...current, newEducationItem()])
            }
          >
            <Plus />
            添加教育经历
          </Button>
          <SaveButton saving={saving} onClick={() => onSave(items)} />
        </div>
      </div>
    </SectionCard>
  );
}

function SkillsSection({
  initial,
  saving,
  onSave,
}: {
  initial: string[];
  saving: boolean;
  onSave: (value: string[]) => void;
}) {
  const [skills, setSkills] = useState(initial);
  const [draft, setDraft] = useState("");

  function addSkill() {
    const next = draft.trim();
    if (!next || skills.includes(next) || skills.length >= 50) {
      setDraft("");
      return;
    }
    setSkills((current) => [...current, next]);
    setDraft("");
  }

  function save() {
    const next = draft.trim();
    const merged =
      next && !skills.includes(next) && skills.length < 50
        ? [...skills, next]
        : skills;
    if (next) setDraft("");
    if (merged !== skills) setSkills(merged);
    onSave(merged);
  }

  return (
    <SectionCard title="技能" hint="回车或点添加，写入一条技能。">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-[#EEF0FF] px-2.5 py-1 text-[13px] font-medium text-[#5A6ACF]"
          >
            {skill}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-white/80"
              aria-label={`移除 ${skill}`}
              onClick={() =>
                setSkills((current) => current.filter((item) => item !== skill))
              }
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          className="h-11 max-w-xs"
          placeholder="例如：TypeScript"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSkill();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 bg-white hover:bg-white"
          onClick={addSkill}
        >
          添加
        </Button>
      </div>
      <div className="mt-4">
        <SaveButton saving={saving} onClick={save} />
      </div>
    </SectionCard>
  );
}

function SummarySection({
  initial,
  saving,
  onSave,
}: {
  initial: string;
  saving: boolean;
  onSave: (value: string) => void;
}) {
  const [summary, setSummary] = useState(initial);

  return (
    <SectionCard title="个人总结">
      <Textarea
        id="overview-summary"
        className="min-h-32"
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
      />
      <div className="mt-4">
        <SaveButton saving={saving} onClick={() => onSave(summary)} />
      </div>
    </SectionCard>
  );
}
