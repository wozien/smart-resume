"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AppFrame } from "@/components/app-frame";
import { ResumeOverviewPanel } from "@/components/resume-overview-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

const passwordSchema = z.object({
  currentPassword: z.string().min(8, "当前密码至少 8 位"),
  newPassword: z.string().min(8, "新密码至少 8 位"),
});

type PasswordValues = z.infer<typeof passwordSchema>;
type AccountTab = "account" | "overview";

function parseTab(raw: string | null): AccountTab {
  if (raw === "overview") return "overview";
  return "account";
}

const tabTriggerClass =
  "h-auto w-full justify-start gap-2 rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#565A78] shadow-none after:hidden hover:bg-[#F6F7FB] hover:text-[#565A78] data-active:bg-[#EEF0FF] data-active:font-semibold data-active:text-[#5A6ACF] data-active:shadow-none";

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onChangePassword(values: PasswordValues) {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (error) {
      toast.error(error.message ?? "修改失败");
      return;
    }
    passwordForm.reset();
    toast.success("密码已更新");
  }

  function handleTabChange(next: string) {
    const tab = parseTab(next);
    router.replace(tab === "account" ? "/account" : `/account?tab=${tab}`);
  }

  return (
    <AppFrame title="个人中心">
      <div className="mx-auto max-w-5xl">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          orientation="vertical"
          className="flex w-full flex-col items-start gap-4 sm:flex-row sm:gap-6"
        >
          <div className="sticky top-0 w-full shrink-0 self-start rounded-2xl border border-[#E7E9F3] bg-white p-3 sm:w-52">
            <TabsList
              variant="line"
              className="flex h-auto w-full flex-col items-stretch justify-start gap-0.5 rounded-none border-0 bg-transparent p-0"
            >
              <TabsTrigger value="account" className={tabTriggerClass}>
                <UserRound className="size-[18px] shrink-0" />
                账号信息
              </TabsTrigger>
              <TabsTrigger value="overview" className={tabTriggerClass}>
                <FileText className="size-[18px] shrink-0" />
                简历概况
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-w-0 w-full flex-1 self-start">
            <TabsContent value="account" keepMounted className="min-w-0">
              <section className="rounded-2xl border border-[#E7E9F3] bg-white p-6">
                <h2 className="text-[15px] font-bold">账号信息</h2>
                <p className="mt-1 text-[13px] text-[#8C8FA8]">
                  邮箱只读，v1 不支持改邮箱或注销。
                </p>
                <div className="mt-4 space-y-1.5">
                  <Label>邮箱</Label>
                  {sessionLoading ? (
                    <Skeleton className="h-11 w-full rounded-lg" />
                  ) : (
                    <Input
                      className="h-11"
                      value={session?.user.email ?? ""}
                      readOnly
                    />
                  )}
                </div>
                <form
                  className="mt-6 space-y-4"
                  onSubmit={passwordForm.handleSubmit(onChangePassword)}
                >
                  <h3 className="text-[14px] font-semibold">改密码</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">当前密码</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      className="h-11"
                      autoComplete="current-password"
                      {...passwordForm.register("currentPassword")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">新密码</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      className="h-11"
                      autoComplete="new-password"
                      {...passwordForm.register("newPassword")}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-10 bg-[#5A6ACF] hover:bg-[#4f5dbb]"
                    disabled={passwordForm.formState.isSubmitting}
                  >
                    {passwordForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        更新中…
                      </>
                    ) : (
                      "更新密码"
                    )}
                  </Button>
                </form>
              </section>
            </TabsContent>

            <TabsContent value="overview" keepMounted className="min-w-0">
              <ResumeOverviewPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppFrame>
  );
}
