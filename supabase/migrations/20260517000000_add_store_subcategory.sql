-- stores 테이블에 세부 카테고리 컬럼 추가
-- 카카오 category_name의 최하위 분류 (예: 냉면, 커피전문점, 디저트카페)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS subcategory text;
