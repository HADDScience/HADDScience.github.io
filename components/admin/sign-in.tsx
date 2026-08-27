"use client"

import { ExternalLink, KeyRound, Loader2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { REPO_NAME, REPO_OWNER, TOKEN_URL } from "@/lib/admin-config"

/**
 * 로그인.
 *
 * GitHub fine-grained PAT 을 붙여 넣는다. 계정마다 자기 토큰을 쓰므로 커밋 작성자가
 * 실제 사람 이름으로 남고, 퇴사하면 그 사람 토큰만 회수하면 된다 — 공용 비밀번호를
 * 두지 않는 이유다.
 */
export function SignIn({
  onSubmit,
  busy,
  error,
}: {
  onSubmit: (token: string, remember: boolean) => void
  busy: boolean
  error?: string
}) {
  const [token, setToken] = React.useState("")
  const [remember, setRemember] = React.useState(true)

  return (
    <div className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 grid gap-2 text-center">
          <p className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            HADD SCIENCE
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">콘텐츠 관리</h1>
          <p className="text-sm text-muted-foreground">
            {REPO_OWNER}/{REPO_NAME} 저장소에 쓰기 권한이 있는 GitHub 토큰으로
            들어옵니다.
          </p>
        </div>

        <form
          className="grid gap-5 rounded-lg border border-border bg-card p-8 shadow-ds-sm"
          onSubmit={(e) => {
            e.preventDefault()
            if (token.trim()) onSubmit(token, remember)
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="token">개인 액세스 토큰</Label>
            <Input
              id="token"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="github_pat_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="font-mono"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 accent-[var(--color-brand-blue-700)]"
            />
            이 브라우저에 저장 (공용 PC 에서는 끄세요)
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-[12px] bg-destructive/8 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={busy || !token.trim()}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            들어가기
          </Button>
        </form>

        <details className="mt-6 rounded-lg border border-border bg-card p-5 text-sm">
          <summary className="cursor-pointer font-semibold">
            토큰은 어떻게 발급하나요?
          </summary>
          <ol className="mt-3 grid gap-2 text-muted-foreground">
            <li>
              1. GitHub → Settings → Developer settings →{" "}
              <a
                href={TOKEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
              >
                Fine-grained tokens <ExternalLink className="size-3" />
              </a>
            </li>
            <li>
              2. Repository access → Only select repositories →{" "}
              <span className="font-mono text-xs">
                {REPO_OWNER}/{REPO_NAME}
              </span>
            </li>
            <li>
              3. Permissions → Repository permissions → Contents 를{" "}
              <span className="font-semibold">Read and write</span> 로
            </li>
            <li>
              4. 만료일은 90일 이내로 두고, 만료되면 다시 발급하세요. 토큰은 이
              브라우저에만 저장되고 다른 곳으로 전송되지 않습니다.
            </li>
          </ol>
        </details>
      </div>
    </div>
  )
}
