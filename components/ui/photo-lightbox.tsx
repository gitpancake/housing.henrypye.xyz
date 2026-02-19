"use client";

import { useEffect, useCallback, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoLightboxProps {
    photos: string[];
    initialIndex: number;
    open: boolean;
    onClose: () => void;
}

export function PhotoLightbox({
    photos,
    initialIndex,
    open,
    onClose,
}: PhotoLightboxProps) {
    const [index, setIndex] = useState(initialIndex);

    useEffect(() => {
        if (open) setIndex(initialIndex);
    }, [open, initialIndex]);

    const prev = useCallback(() => {
        setIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
    }, [photos.length]);

    const next = useCallback(() => {
        setIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
    }, [photos.length]);

    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === "ArrowLeft") prev();
            else if (e.key === "ArrowRight") next();
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, prev, next]);

    if (photos.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95 sm:max-w-[95vw] [&>button]:hidden">
                <div className="relative flex items-center justify-center w-full h-[85vh]">
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>

                    {/* Counter */}
                    <span className="absolute top-3 left-3 z-10 text-white/70 text-sm font-mono">
                        {index + 1} / {photos.length}
                    </span>

                    {/* Previous button */}
                    {photos.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 z-10 text-white hover:bg-white/20 h-12 w-12"
                            onClick={prev}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                    )}

                    {/* Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={photos[index]}
                        alt={`Photo ${index + 1} of ${photos.length}`}
                        className="max-w-full max-h-full object-contain select-none"
                        draggable={false}
                    />

                    {/* Next button */}
                    {photos.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 z-10 text-white hover:bg-white/20 h-12 w-12"
                            onClick={next}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
