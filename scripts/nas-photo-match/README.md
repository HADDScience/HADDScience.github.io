# 카드뉴스 속 사진의 NAS 원본 찾기

파일명으로는 못 찾고(`KakaoTalk_….jpg`), 카드 안 사진은 잘려 있어 해시도 안 맞는다. SIFT 특징점을 RANSAC 으로
맞춰 찾는다. LLM 은 쓰지 않는다 — 문턱 근처의 몇 장만 사람이(또는 값싼 모델이) 본다.

```bash
# 1) NAS 사진 목록 (약 1분)
cd ~/NAS/HADD\ Science && find . -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
  -not -name '~$*' -not -path '*/@eaDir/*' | sed "s|^\./|$HOME/NAS/HADD Science/|" | grep -v '/\$tm\|\.tmp$' > nas-list.txt

# 2) 색인 (7,489장 · 8 스레드 · 약 50분. 병목은 NAS 읽기. 한 번만 하면 된다 — 캐시 3GB 는 저장소 밖에)
python3 index_all.py nas-list.txt nas-cache.pkl

# 3) 질의 (카드 이미지 경로 목록 → 카드마다 상위 5 후보. 사이트 자신의 사본은 뺀다)
EXCLUDE="/files/website/" python3 query_all.py nas-cache.pkl queries.txt result.json

# 4) 보고 (표 + 카드|원본 대조 그림)
python3 report.py result.json report/
```

판정: 인라이어 60 이상 `찾음` · 15 이상이고 2위의 3배 이상 `유력` · 30~60 `애매` · 그 밖 `없음`.
질의 카드에서는 흰 바탕·브랜드 파랑·글자를 지운 뒤 남은 큰 덩어리의 외접 사각형만 사진으로 본다
(`photo_mask`) — 로고·배지·격자가 다른 카드와 맞는 오탐을 막는다. 사진 없는 카드(표지·글만)는 질의에서 뺀다.

NAS 는 사람이 쓰는 중이라 색인 뒤에 폴더 이름이 바뀔 수 있다. `relocate.resolve()` 가 같은 최상위 폴더에서
같은 이름을 다시 찾는다. 실측과 결과는 `mydocs/working/2026-09-08-imweb-news-inventory.md`.
