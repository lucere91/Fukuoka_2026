# 후쿠오카 2026 · 여행 가계부

성인 2명의 공동 현금과 개인카드 지출을 보여주는 모바일 웹사이트입니다. 화면은 로그인 없이 볼 수 있고, 입력은 기존 개인 Google Sheets에서 진행합니다.

## 공개 범위

**중요: 일반 GitHub Pages는 누구나 접속 가능한 공개 사이트입니다.** 링크를 받은 사람만 접근하도록 제한하지 않습니다. `assets/receipts`의 이미지와 `data/ledger.js`에 들어간 금액·상호도 공개됩니다. 현재 개인카드 영수증은 카드 승인전표 페이지를 포함하지 않고 첫 페이지의 식별용 바코드 구간을 제거한 이미지입니다. 앞으로 새로 게시하는 영수증도 개인 식별정보를 확인하고 업로드하세요.

## 1회 배포

1. 공개 저장소 [`lucere91/Fukuoka_2026`](https://github.com/lucere91/Fukuoka_2026)를 사용합니다. GitHub Pages 사이트 및 영수증 이미지는 누구나 접근 가능합니다.
2. 이 압축파일을 풀어 `index.html`, `app.js`, `style.css`, `data`, `assets`, `.nojekyll`을 저장소의 `main` 브랜치 최상위에 업로드합니다. `automation/`은 업로드해도 괜찮지만 동작하지 않으며, 토큰은 절대로 저장소에 올리지 않습니다.
3. Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/(root)` → Save.
4. 저장소를 만들었다면 GitHub 연결을 통해 ChatGPT에 저장소 링크를 주고 파일 업로드를 맡길 수도 있습니다.

## Google Sheets 변경 시 자동 반영

현재 포함된 `data/ledger.js`는 2026년 11월 3일까지 확인한 정산 **스냅샷**입니다. 자동 갱신에는 구글시트 소유자가 아래 설정을 한 번 완료해야 합니다.

1. 개인 계정으로 구글시트 열기 → **확장 프로그램 → Apps Script**.
2. `automation/GoogleSheets_to_GitHub.gs` 내용을 붙여넣기.
3. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens에서 해당 저장소만 선택하고 Contents **Read and write** 권한의 토큰 생성.
4. Apps Script → **프로젝트 설정 → 스크립트 속성**에 `GITHUB_REPO`=`lucere91/Fukuoka_2026`, `GITHUB_TOKEN`=생성한 토큰을 설정. 토큰은 공개 코드나 시트에 넣지 않습니다.
5. Apps Script 편집기에서 `installPublicSyncTrigger` 실행 → 본인 Google 계정으로 권한 승인. 이후 약 15분 간격으로 시트 변경 사항을 확인하고 갱신합니다.

신규 영수증은 Drive에 JPG/PNG로 저장한 후 `01_지출원장`의 L열 또는 `03_개인카드`의 I열에 `=HYPERLINK("https://drive.google.com/file/d/파일ID/view", "영수증 보기")`로 연결하면 이미지가 동기화됩니다. PDF 원본은 개인정보 노출 방지를 위해 자동으로 GitHub에 올리지 않습니다. PDF는 이미지로 변환하고 가림 처리한 후 연결하세요.

**동기화가 이루어진 다음에는 GitHub Pages 주소만 공유하면 됩니다.** 동행인의 구글 계정은 필요하지 않습니다. 동행인은 보기만 가능하고, 구글시트와 데이터 수정은 계정 소유자만 할 수 있습니다.

## 현재 반영한 내용

- 공금 총액: ¥60,000
- 공금 누적 지출: ¥36,928
- 공금 잔액: ¥23,072
- 개인카드 지출: ¥2,978
- 엔화계좌 잔액: ¥47,022 (`11/4 인출 예정 ¥10,000`은 아직 미차감)
- 11/2 공금 영수증 7장, 개인카드 영수증 1장, 11/3 공금 영수증 3장
- 11/3 미증빙 3건은 합계 5,860엔(저녁 3,620엔 + 기타 2건 2,240엔)으로 표시

향후 영수증에 개인 이름, 카드 뒷자리, 회원번호, QR코드, 바코드 등이 보이면 공개용으로 가린 뒤 게시하세요.

## 이 배포 파일의 개인정보 보호 처리

11월 2~3일 영수증은 공개용 파일로 준비했습니다. 개인카드 JCB 승인전표 페이지는 업로드하지 않습니다. 초기 11장의 공개 사진은 Apps Script에서 별도 보관하며, 첫 자동 동기화 시 원본으로 덮어쓰지 않도록 설정되어 있습니다. **신규 영수증은 이미지가 자동 공개될 수 있으므로 업로드 전 개인정보와 바코드·QR코드를 확인해 주세요.**

## 배포 URL

GitHub 저장소의 Settings → Pages에서 `main` 및 `/(root)`를 선택하고 Save하면 일반적으로 `https://lucere91.github.io/Fukuoka_2026/` 형태의 URL이 생성됩니다. URL은 설정 및 배포가 완료된 뒤 확인해야 합니다.
