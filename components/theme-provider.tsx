"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import * as React from "react"

/**
 * 라이트 모드로 고정한다.
 *
 * 디자인시스템에 다크 모드 사양이 없다. readme 의 VISUAL FOUNDATIONS 는
 * "Predominantly flat white with pale grey and pale blue bands",
 * "Neutrals are cool-leaning greys on a pure-white page" 로 흰 페이지를 전제한다.
 *
 * 실제로 다크 모드를 켜면 깨지는 표면이 여럿이다. `Section tone="tint"` 는 배경이
 * `--brand-blue-50` 로 고정인데 글자는 `--foreground` 를 따라가므로, 다크에서
 * 밝은 파란 밴드 위에 흰 글씨가 되어 사라진다. 스티키 헤더와 navy CTA 밴드도 같다.
 * 브랜드 스케일을 표면으로 쓰는 디자인이라 토큰만 뒤집는 방식으로는 해결되지 않는다.
 *
 * 다크 모드를 제품 요구로 정하면 tint / navy 밴드의 다크 대응까지 포함한 사양이
 * 디자인시스템에 먼저 있어야 한다. 그때 `forcedTheme` 을 떼고
 * `app/globals.css` 의 `.dark` 블록을 그 사양으로 교체하면 된다.
 *
 * 스타터에 있던 `d` 키 다크 모드 토글도 제거했다. 회사 홈페이지에서 오타 한 번에
 * 레이아웃이 깨진 다크 모드로 넘어가면 안 된다.
 */
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
