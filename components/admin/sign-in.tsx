"use client"

import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { omnisSettingsUrl } from "@/lib/omnis-auth"

/**
 * 로그인.
 *
 * 버튼 하나뿐이다. 계정은 회사의 HADD 계정(Omnis)이고, 비밀번호·소셜 연결은 전부
 * 그쪽에서 관리한다. 여기서는 그 로그인 화면으로 보냈다가 돌려받을 뿐이다.
 * 예전의 GitHub 토큰 입력은 없앴다 — 발급 절차가 비개발자에게 벅찼고 90일마다 갱신해야 했다.
 */
export function SignIn({ onSubmit, error }: { onSubmit: () => void; error?: string }) {
  return (
    <div className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 grid gap-2 text-center">
          <p className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            HADD SCIENCE
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">콘텐츠 관리</h1>
          <p className="text-sm text-muted-foreground">
            HADD 계정으로 들어옵니다. 업무 시스템과 같은 계정입니다.
          </p>
        </div>

        <div className="grid gap-5 rounded-lg border border-border bg-card p-8 shadow-ds-sm">
          {error ? (
            <p
              role="alert"
              className="rounded-[12px] bg-destructive/8 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button type="button" size="lg" onClick={onSubmit}>
            <LogIn className="size-4" />
            HADD 계정으로 로그인
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            계정이 없거나 비밀번호를 잊었으면{" "}
            <a
              href={omnisSettingsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4"
            >
              계정 설정
            </a>
            에서 처리하거나 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  )
}
