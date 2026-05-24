/**
 * NePick 페이지별 스크린샷 자동 캡처 스크립트
 *
 * 사용법:
 *   1. dev 서버 실행: npm run dev
 *   2. puppeteer 설치 (최초 1회): npm install --save-dev puppeteer
 *   3. 스크립트 실행: node scripts/screenshot.mjs
 *   4. 브라우저에서 소셜 로그인 완료
 *   5. 자동으로 캡처 진행 → nepick-screenshots.zip 생성
 */

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = "./screenshots";
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

// ── 유틸 ────────────────────────────────────────────────────

function mkdir(dir) {
  fs.mkdirSync(path.join(OUT_DIR, dir), { recursive: true });
}

async function shot(page, filePath, label) {
  const fullPath = path.join(OUT_DIR, `${filePath}.png`);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  await page.screenshot({ path: fullPath, fullPage: false });
  console.log(`  ✓ ${label}`);
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function goto(page, url) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle2", timeout: 15000 });
  await wait(600);
}

// ── 메인 ────────────────────────────────────────────────────

async function main() {
  // 출력 폴더 초기화
  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: VIEWPORT,
    args: ["--window-size=430,920", "--disable-notifications"],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // ── 01. Auth 페이지 (로그인 불필요) ─────────────────────
  console.log("\n📸 [1/5] Auth 페이지 캡처 중...");
  mkdir("01_auth");

  await goto(page, "/auth/login");
  await shot(page, "01_auth/01_login", "로그인");

  await goto(page, "/auth/terms");
  await wait(700); // 진입 애니메이션 대기
  await shot(page, "01_auth/02_terms_default", "약관 동의 - 기본");

  // 전체 동의 클릭
  await page.evaluate(() => {
    const allAgreeDiv = Array.from(document.querySelectorAll("div")).find(
      (el) => el.textContent?.includes("전체 동의하기") && el.style.cursor === "pointer"
    );
    allAgreeDiv?.click();
  });
  await wait(400);
  await shot(page, "01_auth/03_terms_all_agreed", "약관 동의 - 전체 동의");

  await goto(page, "/auth/error");
  await shot(page, "01_auth/04_error", "에러 페이지");

  await goto(page, "/auth/signup");
  await wait(500);
  await shot(page, "01_auth/05_signup_empty", "회원가입 - 빈 상태");

  // 닉네임 입력 상태
  await page.type('input[type="text"]', "테스트유저", { delay: 50 });
  await wait(700); // 중복 확인 debounce
  await shot(page, "01_auth/06_signup_nickname", "회원가입 - 닉네임 입력");

  // ── 02. 로그인 대기 ──────────────────────────────────────
  console.log("\n🔐 브라우저에서 로그인해 주세요.");
  console.log("   /home으로 이동되면 자동으로 계속 진행됩니다...\n");

  await goto(page, "/auth/login");
  await page.waitForFunction(() => window.location.pathname === "/home", {
    timeout: 180000, // 3분
  });

  console.log("  ✓ 로그인 완료!\n");
  await wait(1500); // 홈 로딩 대기

  // ── 03. 홈 ──────────────────────────────────────────────
  console.log("📸 [2/5] 홈 캡처 중...");
  mkdir("02_home");

  await shot(page, "02_home/01_home_ranking_half", "홈 - 랭킹시트 절반");

  // 랭킹시트 내리기 (지도 전체 보기)
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (el) => el.textContent?.trim() === "지도보기" || el.textContent?.trim() === "랭킹보기"
    );
    btn?.click();
  });
  await wait(500);
  await shot(page, "02_home/02_home_map_full", "홈 - 지도 전체");

  // ── 04. 기록 추가 ────────────────────────────────────────
  console.log("\n📸 [3/5] 기록 추가 캡처 중...");
  mkdir("03_record");

  await goto(page, "/record");
  await shot(page, "03_record/01_record_empty", "기록 추가 - 빈 상태");

  // 나가기 확인 팝업 (뒤로가기 버튼 클릭)
  const prevBtn = await page.$("button[aria-label='뒤로가기']");
  if (prevBtn) {
    await prevBtn.click();
    await wait(400);
    await shot(page, "03_record/02_record_leave_confirm", "기록 추가 - 나가기 확인");
    // 모달 닫기
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll("button")).find(
        (el) => el.textContent?.trim() === "계속 작성"
      );
      cancelBtn?.click();
    });
    await wait(300);
  }

  // ── 05. 내 픽 ────────────────────────────────────────────
  console.log("\n📸 [4/5] 내 픽 캡처 중...");
  mkdir("04_mypick");

  await goto(page, "/mypick");
  await wait(800);
  await shot(page, "04_mypick/01_mypick_default", "내 픽 - 기본");

  // ── 06. 프로필 ───────────────────────────────────────────
  console.log("\n📸 [5/5] 프로필 캡처 중...");
  mkdir("05_profile");

  await goto(page, "/profile");
  await wait(800);
  await shot(page, "05_profile/01_profile_default", "프로필 - 기본");

  // 로그아웃 모달
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (el) => el.textContent?.trim() === "로그아웃"
    );
    btn?.click();
  });
  await wait(400);
  await shot(page, "05_profile/02_profile_logout_modal", "프로필 - 로그아웃 모달");

  // 모달 닫기
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (el) => el.textContent?.trim() === "취소"
    );
    btn?.click();
  });
  await wait(300);

  // 프로필 수정
  await goto(page, "/profile/edit");
  await wait(500);
  await shot(page, "05_profile/03_profile_edit", "프로필 수정");

  // 권한 설정
  await goto(page, "/profile/permissions");
  await wait(500);
  await shot(page, "05_profile/04_permissions", "권한 설정");

  // 회원탈퇴 - 빈 상태
  await goto(page, "/profile/withdrawal");
  await wait(500);
  await shot(page, "05_profile/05_withdrawal_empty", "회원탈퇴 - 빈 상태");

  // 탈퇴 사유 선택
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button[type='button']"));
    const reasonBtn = btns.find((el) => el.textContent?.includes("자주 사용하지 않아요"));
    reasonBtn?.click();
  });
  await wait(300);
  await shot(page, "05_profile/06_withdrawal_reason_selected", "회원탈퇴 - 사유 선택");

  // 탈퇴 확인 모달
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (el) => el.textContent?.trim() === "탈퇴하기"
    );
    btn?.click();
  });
  await wait(400);
  await shot(page, "05_profile/07_withdrawal_confirm_modal", "회원탈퇴 - 확인 모달");

  // ── ZIP 생성 ─────────────────────────────────────────────
  console.log("\n📦 ZIP 파일 생성 중...");
  const zipName = `nepick-screenshots-${new Date().toISOString().slice(0, 10)}.zip`;
  execSync(
    `powershell -Command "Compress-Archive -Path '${path.resolve(OUT_DIR)}' -DestinationPath '${path.resolve(".", zipName)}' -Force"`
  );
  console.log(`\n✅ 완료! → ${zipName}`);
  console.log(`   총 ${fs.readdirSync(OUT_DIR, { recursive: true }).filter(f => f.endsWith(".png")).length}장 캡처\n`);

  await browser.close();
}

main().catch((err) => {
  console.error("\n❌ 오류 발생:", err.message);
  process.exit(1);
});
