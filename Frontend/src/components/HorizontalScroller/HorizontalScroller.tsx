import { useCallback, useEffect, useRef } from "react";
import "./HorizontalScroller.scss";

interface HorizontalScrollerProps {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

export default function HorizontalScroller({ className = "", style = {}, children }: HorizontalScrollerProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const targetScroll = useRef(0);
    const currentScroll = useRef(0);
    const velocity = useRef(0);
    const rafId = useRef<number | null>(null);
    const observer = useRef<ResizeObserver | null>(null);
    const touchStartX = useRef(0);

    const updateFadeState = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const overflowing = el.scrollWidth > el.clientWidth;
        const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth;
        const showFade = overflowing && !isAtEnd;
        el.classList.toggle("has-overflow-fade", showFade);
    }, []);

    const startLoop = useCallback(() => {
        if (rafId.current !== null) return;

        const step = () => {
            const el = containerRef.current;
            if (!el) return;

            const diff = targetScroll.current - currentScroll.current;

            if (Math.abs(diff) < 0.3 && Math.abs(velocity.current) < 0.1) {
                currentScroll.current = targetScroll.current;
                el.scrollLeft = currentScroll.current;
                rafId.current = null;
                return;
            }

            currentScroll.current += diff * 0.2;
            velocity.current *= 0.5;
            currentScroll.current += velocity.current;

            const max = el.scrollWidth - el.clientWidth;
            currentScroll.current = Math.max(0, Math.min(max, currentScroll.current));
            targetScroll.current = currentScroll.current;

            el.scrollLeft = currentScroll.current;
            updateFadeState();

            rafId.current = requestAnimationFrame(step);
        };

        rafId.current = requestAnimationFrame(step);
    }, [updateFadeState]);

    const addDelta = useCallback(
        (delta: number) => {
            const el = containerRef.current;
            if (!el) return;

            const max = el.scrollWidth - el.clientWidth;
            targetScroll.current += delta;
            targetScroll.current = Math.max(0, Math.min(max, targetScroll.current));
            velocity.current += delta * 0.08;

            if (rafId.current === null) {
                startLoop();
            }
        },
        [startLoop],
    );

    const handleWheel = useCallback(
        (event: WheelEvent) => {
            event.preventDefault();

            let rawDelta = event.deltaY + event.deltaX;
            if (event.deltaMode === 1) {
                rawDelta *= 16;
            }
            addDelta(rawDelta * 2);
        },
        [addDelta],
    );

    const handleTouchStart = useCallback((e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        velocity.current = 0;
    }, []);

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            e.preventDefault();
            const dx = touchStartX.current - e.touches[0].clientX;
            touchStartX.current = e.touches[0].clientX;
            addDelta(dx);
        },
        [addDelta],
    );

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        el.addEventListener("wheel", handleWheel, { passive: false });
        el.addEventListener("touchstart", handleTouchStart, { passive: false });
        el.addEventListener("touchmove", handleTouchMove, { passive: false });

        observer.current = new ResizeObserver(() => {
            updateFadeState();
        });
        observer.current.observe(el);

        updateFadeState();

        return () => {
            el.removeEventListener("wheel", handleWheel);
            el.removeEventListener("touchstart", handleTouchStart);
            el.removeEventListener("touchmove", handleTouchMove);

            observer.current?.disconnect();
            observer.current = null;

            if (rafId.current !== null) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
        };
    }, [handleWheel, handleTouchStart, handleTouchMove, updateFadeState]);

    return (
        <div className={`horizontal-scroller ${className}`} style={style} ref={containerRef}>
            {children}
        </div>
    );
}
