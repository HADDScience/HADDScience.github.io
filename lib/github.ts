/**
 * 브라우저에서 직접 쓰는 GitHub REST 클라이언트.
 *
 * 왜 서버가 없나 — 이 사이트는 `output: "export"` 정적 사이트다. 관리자 페이지도
 * 같은 정적 번들 안에 들어가므로 백엔드를 둘 수 없다. GitHub REST API 는 CORS 를
 * 허용하므로 브라우저가 직접 커밋할 수 있다.
 *
 * 왜 OAuth 가 아니라 PAT 인가 — OAuth 웹 플로우는 client_secret 을 쥔 토큰 교환
 * 서버가 있어야 한다(Decap CMS 가 별도 도메인에 프록시를 두는 이유). 사내 3~5명이
 * 쓰는 도구를 위해 서버를 하나 더 운영하는 것보다, 이 저장소에만 권한을 준
 * fine-grained PAT 을 각자 발급해 쓰는 편이 운영 부담이 적다.
 * 토큰은 그 사람의 브라우저 localStorage 에만 있고 어디로도 전송되지 않는다.
 */

const API = "https://api.github.com"

export interface GhConfig {
  owner: string
  repo: string
  branch: string
  token: string
}

export class GhError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "GhError"
  }
}

async function gh<T>(
  cfg: GhConfig,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${cfg.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { message?: string }
      if (body.message) detail = body.message
    } catch {
      /* 본문이 JSON 이 아니면 상태 텍스트를 그대로 쓴다 */
    }
    throw new GhError(detail, res.status)
  }
  return (await res.json()) as T
}

/* ---------------------------------------------------------------- 인증 */

export interface GhIdentity {
  login: string
  name: string | null
  avatarUrl: string
  /** 저장소에 푸시 권한이 있는가. 없으면 읽기만 가능하다. */
  canWrite: boolean
}

export async function verify(cfg: GhConfig): Promise<GhIdentity> {
  const user = await gh<{ login: string; name: string | null; avatar_url: string }>(
    cfg,
    "/user"
  )
  const repo = await gh<{ permissions?: { push?: boolean } }>(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}`
  )
  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    canWrite: Boolean(repo.permissions?.push),
  }
}

/* ---------------------------------------------------------------- 읽기 */

/** UTF-8 안전한 base64 디코딩. atob 는 바이트 단위라 한글이 깨진다. */
function decodeBase64(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ""))
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** UTF-8 안전한 base64 인코딩. 큰 파일에서 스택이 넘치지 않도록 나눠 처리한다. */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = ""
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export function encodeTextBase64(text: string): string {
  return encodeBase64(new TextEncoder().encode(text))
}

export async function readText(cfg: GhConfig, path: string): Promise<string> {
  // 1MB 가 넘는 파일은 contents API 가 본문을 비워 보낸다. 기사 JSON 은 훨씬 작다.
  const file = await gh<{ content: string; encoding: string }>(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch}`
  )
  if (file.encoding !== "base64") throw new GhError("예상치 못한 인코딩", 500)
  return decodeBase64(file.content)
}

export interface GhEntry {
  name: string
  path: string
  sha: string
  size: number
  type: "file" | "dir"
}

/** 디렉터리 목록. 파일 내용은 오지 않고 blob sha 만 온다 — 캐시 키로 쓴다. */
export async function listDir(cfg: GhConfig, path: string): Promise<GhEntry[]> {
  try {
    return await gh<GhEntry[]>(
      cfg,
      `/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch}`
    )
  } catch (err) {
    // 아직 만들어지지 않은 디렉터리는 빈 목록으로 본다.
    if (err instanceof GhError && err.status === 404) return []
    throw err
  }
}

/** blob sha 로 직접 읽는다. 경로가 아니라 내용의 해시라 캐시가 항상 유효하다. */
export async function readBlob(cfg: GhConfig, sha: string): Promise<string> {
  const blob = await gh<{ content: string; encoding: string }>(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/git/blobs/${sha}`
  )
  if (blob.encoding !== "base64") throw new GhError("예상치 못한 인코딩", 500)
  return decodeBase64(blob.content)
}

export async function readJson<T>(cfg: GhConfig, path: string): Promise<T> {
  return JSON.parse(await readText(cfg, path)) as T
}

/* ---------------------------------------------------------------- 쓰기 */

export type FileChange =
  | { path: string; text: string }
  | { path: string; base64: string }
  | { path: string; remove: true }

/**
 * 여러 파일을 커밋 하나로 묶는다.
 *
 * contents API 를 파일마다 PUT 하면 커밋이 파일 수만큼 생기고, 중간에 실패하면
 * 기사 JSON 은 올라갔는데 이미지는 빠진 상태가 남는다. Git Data API 로 트리를
 * 한 번에 만들면 전부 반영되거나 전부 안 되거나 둘 중 하나다.
 */
export async function commitFiles(
  cfg: GhConfig,
  message: string,
  changes: FileChange[]
): Promise<{ sha: string; url: string }> {
  const base = `/repos/${cfg.owner}/${cfg.repo}`

  const ref = await gh<{ object: { sha: string } }>(
    cfg,
    `${base}/git/ref/heads/${cfg.branch}`
  )
  const parent = ref.object.sha
  const parentCommit = await gh<{ tree: { sha: string } }>(
    cfg,
    `${base}/git/commits/${parent}`
  )

  const tree = await Promise.all(
    changes.map(async (change) => {
      if ("remove" in change) {
        // sha: null 이 그 경로를 트리에서 지운다.
        return {
          path: change.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: null,
        }
      }
      const blob = await gh<{ sha: string }>(cfg, `${base}/git/blobs`, {
        method: "POST",
        body: JSON.stringify(
          "text" in change
            ? { content: change.text, encoding: "utf-8" }
            : { content: change.base64, encoding: "base64" }
        ),
      })
      return {
        path: change.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      }
    })
  )

  const newTree = await gh<{ sha: string }>(cfg, `${base}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
  })

  const commit = await gh<{ sha: string; html_url: string }>(
    cfg,
    `${base}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [parent],
      }),
    }
  )

  // force 를 쓰지 않는다. 그 사이 누가 푸시했다면 실패해야 남의 커밋을 덮지 않는다.
  await gh(cfg, `${base}/git/refs/heads/${cfg.branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  return { sha: commit.sha, url: commit.html_url }
}

/* ---------------------------------------------------------------- 배포 상태 */

export interface GhRun {
  status: string
  conclusion: string | null
  htmlUrl: string
  headSha: string
}

/** 가장 최근 Pages 배포 워크플로 실행. 관리자에게 "반영 중 / 반영됨" 을 보여준다. */
export async function latestRun(cfg: GhConfig): Promise<GhRun | null> {
  const res = await gh<{
    workflow_runs: {
      status: string
      conclusion: string | null
      html_url: string
      head_sha: string
    }[]
  }>(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/actions/runs?branch=${cfg.branch}&per_page=1`
  )
  const run = res.workflow_runs[0]
  if (!run) return null
  return {
    status: run.status,
    conclusion: run.conclusion,
    htmlUrl: run.html_url,
    headSha: run.head_sha,
  }
}
