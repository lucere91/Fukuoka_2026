# 후쿠오카 2026 · 공금 가계부

두 명이 사용하는 **공동경비(현금) 전용** 여행 가계부입니다. 모바일에서 날짜별 지출과 영수증을 확인할 수 있습니다.

**입력·정산 원본:** [공금 Google Sheets](https://docs.google.com/spreadsheets/d/10TRwn30Vk7KGTMkjnGz3nT9A7SFL55dM0TQvYzqgTwU/edit)

**개인카드·개인 엔화계좌 정보는 이 사이트에 게시하지 않습니다.** 별도 비공개 Google Sheets에서만 관리합니다.

## 2026년 11월 5일 공금 정산
- 총 공금 **¥60,000** (각 ¥30,000)
- 누적 지출 **¥59,647**
- 남은 현금 **¥353**
- 공금 지출 **20행** (실제 미증빙 2건 합산 입력 포함)
- 사진이 있는 영수증 **17장** (11/2 7장, 11/3 3장, 11/4 5장, 11/5 2장)
- 미증빙: 11/3 저녁식사 ¥3,620, 미확인 2건 합계 ¥2,240, 택시 ¥1,501

## GitHub Pages
Settings → Pages에서 Source `Deploy from a branch`, Branch `main` / `/(root)`를 선택하면 공개 주소가 생성됩니다.

**주의:** 일반 GitHub Pages는 로그인 없이 누구나 조회 가능한 공개 사이트입니다. 보안 인증이나 '링크를 아는 사람만' 제한이 아닙니다. 기존 이전 Git 커밋에는 과거 개인카드 정보가 남아 있을 수 있어 별도 이력 정리가 필요합니다.

## 구글시트 자동 갱신 (별도 최초 설정 필요)
`automation/GoogleSheets_to_GitHub.gs`를 **공금 Google Sheets**의 확장 프로그램 → Apps Script에 설치하고,
스크립트 속성 `GITHUB_REPO` = `lucere91/Fukuoka_2026`, `GITHUB_TOKEN` = 권한이 제한된 GitHub fine-grained token (Contents: Read and write)을 설정합니다.
그 뒤 `installPublicSyncTrigger`를 최초 1회 실행합니다. 코드는 공금 파일의 `00_요약`과 `01_지출원장`만 읽고, 개인카드 시트나 개인계좌 시트는 읽지 않습니다.

영수증 이미지 업로드는 **자동이 아닙니다.** 공개용으로 검토된 파일만 `assets/receipts/`에 업로드하고 `PUBLIC_RECEIPTS` 화이트리스트에 ID를 추가합니다. 미등록 영수증은 지출내역만 공개되고 사진은 표시하지 않습니다. 원본 사진의 계좌번호·회원번호·QR·바코드 등을 확인하고 가린 뒤 게시합니다.
