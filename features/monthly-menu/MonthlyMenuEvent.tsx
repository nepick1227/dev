"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { CloseIcon } from "@/components/ui/icons";
import {
  formatMonthlyMenuDate,
  type MonthlyMenuRecord,
  type MonthlyMenuResult,
} from "@/lib/monthly-menu";

interface MonthlyMenuStatus {
  sourceMonth: string;
  monthLabel: string;
  title: string;
  records: MonthlyMenuRecord[];
  generationCount: number;
  remainingGenerations: number;
  isUnlimited: boolean;
  canGenerate: boolean;
  shouldAutoOpen: boolean;
}

interface MonthlyMenuEventProps {
  autoOpen?: boolean;
  showLauncher?: boolean;
}

export default function MonthlyMenuEvent({
  autoOpen = false,
  showLauncher = false,
}: MonthlyMenuEventProps) {
  const autoOpenHandled = useRef(false);
  const [status, setStatus] = useState<MonthlyMenuStatus | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [result, setResult] = useState<MonthlyMenuResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    setIsStatusLoading(true);
    try {
      const response = await fetch("/api/monthly-menu", { cache: "no-store" });
      if (!response.ok) return;
      const nextStatus = await response.json() as MonthlyMenuStatus;
      setStatus(nextStatus);

      if (autoOpen && nextStatus.shouldAutoOpen && !autoOpenHandled.current) {
        autoOpenHandled.current = true;
        setIsOpen(true);
        void fetch("/api/monthly-menu", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "seen" }),
        });
      }
    } finally {
      setIsStatusLoading(false);
    }
  }, [autoOpen]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const open = useCallback(() => {
    setSelectedIds([]);
    setResult(null);
    setError("");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (isGenerating) return;
    setIsOpen(false);
    setError("");
  }, [isGenerating]);

  const toggleRecord = useCallback((recordId: number) => {
    setError("");
    setSelectedIds((current) => {
      if (current.includes(recordId)) {
        return current.filter((id) => id !== recordId);
      }
      if (current.length >= 3) return current;
      return [...current, recordId];
    });
  }, []);

  const generate = useCallback(async () => {
    if (selectedIds.length < 2 || selectedIds.length > 3) return;
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/monthly-menu/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds: selectedIds }),
      });
      const data = await response.json() as MonthlyMenuResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "메뉴판 생성에 실패했습니다.");

      setResult(data);
      setStatus((current) => current ? {
        ...current,
        generationCount: data.isUnlimited ? current.generationCount : 2 - data.remainingGenerations,
        remainingGenerations: data.remainingGenerations,
        isUnlimited: data.isUnlimited,
        canGenerate: (data.isUnlimited || data.remainingGenerations > 0) && current.records.length >= 3,
      } : current);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "메뉴판 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedIds]);

  const restart = useCallback(() => {
    setResult(null);
    setSelectedIds([]);
    setError("");
  }, []);

  if (!showLauncher && !isOpen) return null;

  return (
    <>
      {showLauncher && (
        <div className="app-content-readable shrink-0 px-5 pt-3">
          <button
            onClick={open}
            disabled={isStatusLoading}
            className="flex w-full items-center justify-between rounded-xl border border-primary/25 bg-primary-soft px-4 py-3 text-left disabled:opacity-60"
          >
            <div>
              <p className="text-[14px] font-bold tracking-tight text-primary">
                {status?.title ?? "전월의 메뉴판"}
              </p>
              <p className="mt-0.5 text-[12px] tracking-tight text-text-secondary">
                사진 기록 2~3개를 골라 공유 카드를 만들어보세요
              </p>
            </div>
            <span className="text-[12px] font-semibold text-primary">
              {status ? (status.isUnlimited ? "DEV 무제한" : `${status.remainingGenerations}/2회 남음`) : "확인"}
            </span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="relative flex max-h-[92dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
            <header className="flex shrink-0 items-center border-b border-border px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold text-primary">MONTHLY MENU</p>
                <h2 className="text-[20px] font-extrabold tracking-tight text-text-primary">
                  {result?.title ?? status?.title ?? "전월의 메뉴판"}
                </h2>
              </div>
              <button
                onClick={close}
                className="ml-auto rounded-full p-2 hover:bg-bg"
                aria-label="닫기"
              >
                <CloseIcon size={20} color="var(--color-text-secondary)" />
              </button>
            </header>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
              {isStatusLoading && !status ? (
                <div className="flex min-h-72 items-center justify-center">
                  <Spinner size={28} />
                </div>
              ) : result ? (
                <GeneratedView result={result} />
              ) : status ? (
                <SelectionView
                  status={status}
                  selectedIds={selectedIds}
                  onToggle={toggleRecord}
                />
              ) : (
                <p className="py-16 text-center text-[14px] text-text-secondary">
                  전월 기록을 불러오지 못했어요. 잠시 후 화면을 새로고침해 주세요.
                </p>
              )}

              {error && (
                <p className="mt-4 rounded-xl bg-primary-soft px-4 py-3 text-[13px] text-primary">
                  {error}
                </p>
              )}
            </div>

            <footer className="shrink-0 border-t border-border bg-surface px-5 py-4">
              {result ? (
                <div className="flex gap-2.5">
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={restart}
                    disabled={!status?.isUnlimited && (status?.remainingGenerations ?? 0) <= 0}
                  >
                    다시 만들기
                  </Button>
                  <Button
                    size="md"
                    fullWidth
                    onClick={() => void downloadMonthlyMenu(result).catch(() => {
                      setError("이미지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
                    })}
                  >
                    이미지 저장
                  </Button>
                </div>
              ) : (
                <Button
                  size="md"
                  fullWidth
                  onClick={generate}
                  isLoading={isGenerating}
                  disabled={
                    selectedIds.length < 2 ||
                    selectedIds.length > 3 ||
                    !status?.canGenerate
                  }
                >
                  {selectedIds.length < 2
                    ? "기록을 2개 이상 선택해 주세요"
                    : `${selectedIds.length}개로 메뉴판 만들기`}
                </Button>
              )}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function SelectionView({
  status,
  selectedIds,
  onToggle,
}: {
  status: MonthlyMenuStatus;
  selectedIds: number[];
  onToggle: (recordId: number) => void;
}) {
  if (status.records.length < 3) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center text-center">
        <p className="text-[16px] font-bold text-text-primary">사진 기록이 더 필요해요</p>
        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
          전월에 이미지가 포함된 기록이 3개 이상일 때<br />
          월간 메뉴판을 만들 수 있습니다.
        </p>
      </div>
    );
  }

  if (!status.isUnlimited && status.remainingGenerations <= 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center text-center">
        <p className="text-[16px] font-bold text-text-primary">이번 달 메뉴판을 모두 만들었어요</p>
        <p className="mt-2 text-[13px] text-text-secondary">
          월간 메뉴판은 한 달에 2번까지 생성할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold tracking-tight text-text-primary">
            사진 기록을 2~3개 골라주세요
          </p>
          <p className="mt-1 text-[12px] text-text-secondary">
            전월 이미지 기록 {status.records.length}개 · {status.isUnlimited
              ? "개발 환경 무제한"
              : `이번 달 ${status.remainingGenerations}회 남음`}
          </p>
        </div>
        <span className="shrink-0 text-[13px] font-bold text-primary">
          {selectedIds.length}/3
        </span>
      </div>

      <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-3 sm:grid-cols-3">
        {status.records.map((record) => {
          const selected = selectedIds.includes(record.id);
          return (
            <button
              key={record.id}
              onClick={() => onToggle(record.id)}
              className={[
                "flex h-full min-w-0 flex-col overflow-hidden rounded-xl border-2 bg-surface text-left transition-all",
                selected ? "border-primary shadow-md" : "border-transparent ring-1 ring-border",
              ].join(" ")}
            >
              <div className="relative aspect-square overflow-hidden bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={record.imageUrl} alt="" className="h-full w-full object-cover" />
                <span
                  className={[
                    "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-[12px] font-bold",
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-white/80 bg-black/35 text-white",
                  ].join(" ")}
                >
                  {selected ? selectedIds.indexOf(record.id) + 1 : ""}
                </span>
              </div>
              <div className="flex min-h-[112px] flex-1 flex-col p-3">
                <p className="h-5 truncate text-[13px] font-bold leading-5 text-text-primary">
                  {record.storeName}
                </p>
                <p className="mt-0.5 h-4 text-[11px] leading-4 text-text-secondary">
                  {formatMonthlyMenuDate(record.visitedAt)}
                </p>
                <p className="mt-1 line-clamp-2 min-h-9 text-[11px] leading-[18px] text-text-secondary">
                  {record.comment}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function GeneratedView({ result }: { result: MonthlyMenuResult }) {
  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div
        className="overflow-hidden border border-[#EADADA] bg-[#FFFDFC] shadow-xl"
        style={{ aspectRatio: "1 / 1" }}
      >
        <div className="flex h-full flex-col p-[6%]">
          <div className="shrink-0 border-b-2 border-primary pb-[4%]">
            <p className="text-[10px] font-bold tracking-[0.18em] text-primary">NEPICK MONTHLY MENU</p>
            <h3 className="mt-1 text-[clamp(24px,6vw,38px)] font-black leading-none tracking-tight text-text-primary">
              {result.title}
            </h3>
            <p className="mt-2 text-[clamp(11px,2.5vw,14px)] text-text-secondary">{result.subtitle}</p>
          </div>

          <div className="mt-[3%] min-h-0 flex-1 overflow-hidden bg-[#F8F2EA]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.artworkUrl}
              alt="선택한 맛집 사진을 색연필로 재해석한 월간 메뉴판"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-[3%] grid shrink-0 gap-[3%]" style={{
            gridTemplateColumns: `repeat(${result.items.length}, minmax(0, 1fr))`,
          }}>
            {result.items.map((item) => (
              <div key={item.id} className="flex min-w-0 flex-col">
                <p className="truncate text-[clamp(11px,2.6vw,15px)] font-extrabold text-text-primary">
                  {item.storeName}
                </p>
                <p className="text-[clamp(9px,2vw,11px)] font-semibold text-primary">
                  {formatMonthlyMenuDate(item.visitedAt)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[clamp(8px,1.8vw,11px)] leading-relaxed text-text-secondary">
                  {item.caption}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-[4%] flex shrink-0 items-center justify-between border-t border-border pt-[3%]">
            <span className="text-[9px] font-bold tracking-[0.16em] text-primary">NEPICK</span>
            <span className="text-[9px] text-text-tertiary">나의 지난달 맛집 기록</span>
          </div>
        </div>
      </div>
    </div>
  );
}

async function downloadMonthlyMenu(result: MonthlyMenuResult) {
  const width = 1080;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  context.fillStyle = "#FFFDFC";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#D32F2F";
  context.font = "700 24px Pretendard, sans-serif";
  context.fillText("NEPICK MONTHLY MENU", 72, 82);

  context.fillStyle = "#111827";
  context.font = "900 66px Pretendard, sans-serif";
  context.fillText(result.title, 72, 160);

  context.fillStyle = "#6B7280";
  context.font = "400 28px Pretendard, sans-serif";
  context.fillText(result.subtitle, 72, 210);

  context.fillStyle = "#D32F2F";
  context.fillRect(72, 244, width - 144, 4);

  const artwork = await loadCanvasImage(result.artworkUrl);
  drawCoverImage(context, artwork, 72, 270, width - 144, 500);

  const gap = 22;
  const contentWidth = width - 144;
  const itemWidth = (contentWidth - gap * (result.items.length - 1)) / result.items.length;
  result.items.forEach((item, index) => {
    const x = 72 + index * (itemWidth + gap);

    context.fillStyle = "#111827";
    context.font = "800 27px Pretendard, sans-serif";
    drawWrappedText(context, item.storeName, x, 820, itemWidth, 34, 2);

    context.fillStyle = "#D32F2F";
    context.font = "700 20px Pretendard, sans-serif";
    context.fillText(formatMonthlyMenuDate(item.visitedAt), x, 890);

    context.fillStyle = "#6B7280";
    context.font = "400 20px Pretendard, sans-serif";
    drawWrappedText(context, item.caption, x, 925, itemWidth, 27, 2);
  });

  context.strokeStyle = "#E5E7EB";
  context.beginPath();
  context.moveTo(72, 1000);
  context.lineTo(width - 72, 1000);
  context.stroke();

  context.fillStyle = "#D32F2F";
  context.font = "800 18px Pretendard, sans-serif";
  context.fillText("NEPICK", 72, 1042);
  context.fillStyle = "#9CA3AF";
  context.textAlign = "right";
  context.font = "400 18px Pretendard, sans-serif";
  context.fillText("나의 지난달 맛집 기록", width - 72, 1042);
  context.textAlign = "left";

  const link = document.createElement("a");
  link.download = `${result.title.replace(/\s/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function loadCanvasImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("image_fetch_failed");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const characters = Array.from(text);
  let line = "";
  let lineIndex = 0;

  for (let index = 0; index < characters.length; index += 1) {
    const nextLine = line + characters[index];
    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, y + lineIndex * lineHeight);
      lineIndex += 1;
      line = characters[index];
      if (lineIndex >= maxLines) return;
    } else {
      line = nextLine;
    }
  }

  if (lineIndex < maxLines && line) {
    context.fillText(line, x, y + lineIndex * lineHeight);
  }
}
