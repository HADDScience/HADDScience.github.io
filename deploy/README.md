# 배포

산출물은 하나다. `pnpm build` 가 만드는 **정적 파일 `out/`** 을 두 곳에 올린다.

| 대상 | 용도 | 방법 |
| --- | --- | --- |
| `haddscience.github.io` | 대표님 컨펌용 | GitHub Actions 자동 (`.github/workflows/deploy-pages.yml`) |
| `haddscience.com` | 실서비스 | Synology Web Station + `scripts/deploy-synology.sh` |

같은 `out/` 을 올리므로 **컨펌한 화면과 실서비스 화면이 다를 수 없다.** 이게 정적 단일
산출물을 택한 이유다.

---

## 1. GitHub Pages (컨펌용)

### 최초 1회 설정

```bash
# 1) 조직에 레포 생성 (조직 루트 사이트라 이름이 반드시 <org>.github.io 여야 한다)
gh repo create HADDScience/HADDScience.github.io --public --source=. --remote=origin --push

# 2) Settings > Pages > Build and deployment > Source 를 "GitHub Actions" 로 변경
gh api -X POST /repos/HADDScience/HADDScience.github.io/pages \
  -f 'build_type=workflow' 2>/dev/null || echo "웹 UI 에서 Source 를 GitHub Actions 로 바꿀 것"
```

이후에는 `main` 에 푸시하면 자동 배포된다. 결과는 `https://haddscience.github.io/`.

### 알아둘 것

- **`.nojekyll` 이 없으면 사이트가 깨진다.** GitHub Pages 는 Jekyll 을 기본 적용하고
  `_` 로 시작하는 폴더를 무시하는데, Next 의 자산은 전부 `_next/` 안에 있다.
  `scripts/postbuild.mjs` 가 매 빌드마다 생성하고 존재를 검증한다.
- **루트 `/` 에는 페이지가 없다.** 모든 라우트가 `/[lang]/` 아래에 있고, 정적 호스팅에는
  `proxy.ts` 리다이렉트가 없다. `scripts/postbuild.mjs` 가 브라우저 언어를 보고
  `/ko/` 또는 `/en/` 으로 보내는 `out/index.html` 을 만든다.
- 컨펌용이라 검색엔진에 노출할 이유가 없다. 필요하면 `public/robots.txt` 에
  `Disallow: /` 를 넣어 올리고, 실도메인 배포 때 빼면 된다.

---

## 2. Synology (실서비스)

정적 파일이라 Node 런타임이 필요 없다. **Web Station 으로 폴더만 서빙하면 끝이다.**

### DSM 설정 (수동, 최초 1회)

1. **공유폴더** — `web` 아래에 `haddscience` 폴더를 만든다. (예: `/volume1/web/haddscience`)
2. **Web Station > 웹 서비스** — 정적 웹사이트로 위 폴더를 지정.
3. **Web Station > 웹 포털** — 가상 호스트를 `haddscience.com`, `www.haddscience.com` 으로
   추가하고 위 웹 서비스에 연결.
4. **제어판 > 로그인 포털 > 고급 > 역방향 프록시** 로 80/443 을 위 포털에 연결.
5. **제어판 > 보안 > 인증서** — Let's Encrypt 로 `haddscience.com` + `www` 발급.
   자동 갱신을 켤 것.
6. **공유기** — 80/443 을 NAS 로 포워딩.
7. **DNS** — 도메인 등록기관에서 `haddscience.com` A 레코드를 NAS 공인 IP 로.
   고정 IP 가 아니면 DDNS 를 쓰고 CNAME 으로 연결.

### 배포

```bash
# 환경변수로 대상을 지정한다 (~/.zshrc 에 넣어두면 편하다)
export HADD_DEPLOY_HOST=admin@nas.example.com
export HADD_DEPLOY_PATH=/volume1/web/haddscience

pnpm build
./scripts/deploy-synology.sh
```

스크립트는 `rsync --delete` 로 동기화한다. 즉 **`out/` 에 없는 파일은 서버에서도
지워진다.** 대상 경로를 잘못 넣으면 그 폴더가 비워지므로, 스크립트가 실행 전에 대상
경로와 파일 수를 보여주고 확인을 받는다.

### 짚어둘 위험

기술이 아니라 운영 쪽 문제다.

- **회선·정전이 곧 사이트 장애다.** 사무실 인터넷이 끊기면 회사 홈페이지가 내려간다.
- **업로드 대역폭이 병목이다.** 이미지가 19MB 규모라 동시 접속이 몰리면 느려진다.
- **NAS 를 공개망에 노출하는 리스크** — DSM 관리 포트는 절대 함께 열지 말 것.

정적 파일이라는 점을 이용해 **Cloudflare 를 앞에 두는 것을 강하게 권한다.** 무료 플랜으로
DNS 를 Cloudflare 로 옮기고 프록시를 켜면 원본 IP 가 숨고, 캐시가 대부분의 트래픽을
받아내며, NAS 가 잠깐 죽어도 Always Online 으로 버틴다. 이러면 위 세 위험이 거의 사라진다.

대안으로, 같은 `out/` 을 Cloudflare Pages 나 Vercel 에 올리면 NAS 운영 부담 자체가
없어진다. 사내 인프라를 쓰고 싶다는 요구가 우선이면 위 구성으로 충분하다.
