import { useCallback, useEffect, useRef, useState } from "react";
import { NepickApiError } from "./api";

interface ResourceState<T> {
  data: T | null;
  error: NepickApiError | null;
}

/**
 * 화면이 열릴 때 한 번 불러오고 reload로 다시 불러온다.
 * reload 중에는 보이던 내용을 유지하고, 늦게 도착한 이전 응답은 버린다.
 * load는 useCallback 등으로 고정된 함수여야 한다.
 */
export function useNepickResource<T>(load: () => Promise<T>) {
  const [state, setState] = useState<ResourceState<T>>({ data: null, error: null });
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const data = await load();
      if (requestId === requestIdRef.current) setState({ data, error: null });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      const apiError = error instanceof NepickApiError
        ? error
        : new NepickApiError("네 픽을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", 0);
      setState((current) => ({ data: current.data, error: apiError }));
    }
  }, [load]);

  useEffect(() => {
    void Promise.resolve().then(reload);
    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return { ...state, reload };
}
