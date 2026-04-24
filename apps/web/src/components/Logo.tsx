"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface LogoProps {
  width?: number;
  height?: number;
  colorScheme?: "light" | "dark";
  className?: string;
}

export function Logo({ width = 120, height = 40, colorScheme, className }: LogoProps) {
  const [resolvedScheme, setResolvedScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (colorScheme) {
      setResolvedScheme(colorScheme);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setResolvedScheme(mq.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => setResolvedScheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [colorScheme]);

  const src =
    resolvedScheme === "dark" ? "/images/logo-inverse.png" : "/images/logo.png";

  return (
    <Image
      src={src}
      alt="Suliv"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
