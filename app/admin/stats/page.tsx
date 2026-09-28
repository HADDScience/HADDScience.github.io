import { redirect } from "next/navigation"

/**
 * 통계는 이제 관리 화면의 첫 화면(`/admin`)이다. 2026-09-22 ~ 09-28 사이에 `/admin/stats`
 * 로 안내한 적이 있어(문서·즐겨찾기) 죽은 주소로 두지 않고 보내 준다.
 */
export default function AdminStatsRedirect() {
  redirect("/admin")
}
