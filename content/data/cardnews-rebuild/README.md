# 옛 카드뉴스 → 새 레이아웃 덱 (추출 작업 지침)

`<id>.json` 한 파일이 옛 글 하나다. 모양:

```jsonc
{
  "id": "172288085",
  "title": "원문 제목(옛 기사 JSON 의 content.ko.title 그대로)",
  "cards": [
    {
      // 옛 카드 파일명. public/news/<id>/NN.webp (1024×1024)
      "source": "01.webp",
      // 그 카드에 적힌 글자 전부, 보이는 순서대로, 줄바꿈은 \n. 이모지 포함. 로고·핸들(@haddscience) 제외.
      "sourceText": "chapter 01\n샌디에이고 바이오 허브에\n하드사이언스가 찾아가다",
      // 카드 안 사진 영역. 없으면 null. 원본 1024 기준 픽셀 [x, y, w, h]. 사진이 둘 이상이면 가장 큰 것.
      "photo": [96, 300, 832, 480],
      // 새 카드 (content/types.ts 의 Card). image 가 필요하면 { "src": "@photo" } 로 두면 뒤에서 잘라 넣는다.
      "card": { "type": "chapter", "layout": "standard", "badge": "chapter 01", "headline": "…", "body": "…" }
    }
  ]
}
```

레이아웃 고르는 기준(`lib/cardnews.ts` 의 9종):
- 표지(로고 + "카드뉴스" + 버튼) → `cover`
- 제목 + 사진 + 본문 → `standard` (사진이 위를 꽉 채우면 `image-top`, 사진이 카드 전체이고 글이 그 위면 `overlay`, 세로로 긴 사진이 왼쪽이면 `split`)
- 사진 없이 큰 문장 → `text`
- 숫자 강조 → `stat`, 항목 나열 → `list`
- 마지막 "대표 한마디" 인용 → `quote`

텍스트는 **원문 그대로**. 요약하거나 고치지 않는다. 옛 카드에서 배지처럼 쓰인 "chapter 01" 은 `badge` 로, 큰 제목은 `headline`, 나머지 문장은 `body`(문단 사이 `\n\n`), 작은 강조 한 줄은 `footnote`.

## 넘치거나 대조가 안 맞을 때

- 목록·본문이 카드를 넘치면 옛 카드 하나를 새 카드 **여러 장**으로 나눈다: `"card"` 대신
  `"cards": [ {...}, {...} ]`. 배지는 같은 번호에 `chapter 03` · `chapter 03` 처럼 두거나 이어 붙인다. 글자는 줄이지 않는다.
- 사진 안에 박힌 글자(로고 · 표 이미지)는 새 카드에서도 사진으로 남으니 대조에서 뺀다:
  `"omit": [ { "line": "그 줄", "why": "로고 이미지 안의 글자" } ]`. 이유 없이 빼지 않는다.
