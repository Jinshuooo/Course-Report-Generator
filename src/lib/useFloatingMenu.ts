import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const GAP = 8;
const MIN_HEIGHT = 160;
const VIEWPORT_EDGE = 12;

/**
 * 下拉面板统一挂在 body 上（portal + fixed），位置根据触发元素实时计算。
 * 这样就不会被后续字段、卡片或任何祖先层叠上下文压住。
 */
export const useFloatingMenu = <T extends HTMLElement>(
  isOpen: boolean,
  anchorRef: RefObject<T | null>
) => {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const top = rect.bottom + GAP;

    setPosition({
      top,
      left: rect.left,
      width: rect.width,
      // 面板不超出视口底部
      maxHeight: Math.max(MIN_HEIGHT, window.innerHeight - top - VIEWPORT_EDGE),
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!isOpen) return;

    measure();

    const handleReposition = () => measure();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, measure]);

  return { position, menuRef, measure };
};
