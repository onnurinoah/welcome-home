# Welcome Home — 기도로 짓는 집

기도 시간이 쌓일수록 청사진 위에 집이 한 획씩 완성되는 CH PLUS **Welcome Home** 기도 페이지입니다.

## 구조

- `prayer/index.html` — 모바일 중심 기도 페이지
- `prayer/server/Code.gs` — Google Apps Script 누적 서버
- `prayer/server/supabase.sql` — Supabase 대체 스키마

## 동작

- 목표: 1000시간
- 화면에는 누적 시간 숫자를 직접 표시하지 않고, 기도량에 따라 집의 도면이 아래에서 위로 그려집니다.
- 0%에 가까운 구간은 의도적으로 오래 비워 두어 첫 기도의 변화가 보이도록 했습니다.
- 진행 단계에 따라 "첫 선이 집의 시작이 됩니다" → "기도가 한 겹씩 집을 세우고 있습니다" 등의 문구가 바뀝니다.
- 100%가 되면 청사진이 입체적인 집으로 전환되고 창에 따뜻한 빛이 켜집니다.

## Apps Script 연결

1. Google 스프레드시트에서 **확장 프로그램 → Apps Script**를 엽니다.
2. `prayer/server/Code.gs` 내용을 붙여넣습니다.
3. **배포 → 새 배포 → 웹 앱**으로 배포합니다.
4. 실행 계정은 **나**, 접근 권한은 **모든 사용자**로 설정합니다.
5. 배포된 웹 앱 URL을 페이지의 `SERVER_URL`에 넣거나, 접속 URL 뒤에 `?server=웹앱URL`을 붙입니다.

Apps Script는 기도제목·마음의 감동·이름을 Google Sheet에 저장하고, 공개 화면에는 누적 시간만 반환합니다. 누적 합계는 Script Properties에 캐시하여 매 조회마다 전체 행을 다시 계산하지 않습니다.

## Supabase

`prayer/server/supabase.sql`을 SQL Editor에서 실행한 뒤 Project URL과 anon public key를 페이지의 `SUPABASE` 설정에 넣으면 사용할 수 있습니다.
