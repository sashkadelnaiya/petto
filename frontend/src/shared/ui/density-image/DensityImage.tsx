import type { ImgHTMLAttributes } from "react";
import type { StaticImageData } from "next/image";

export function densitySrcSet(
  x1: StaticImageData,
  x2: StaticImageData,
  x3: StaticImageData,
): string {
  return `${x1.src} 1x, ${x2.src} 2x, ${x3.src} 3x`;
}

export type DensityImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet"
> & {
  src1x: StaticImageData;
  src2x: StaticImageData;
  src3x: StaticImageData;
};

export function DensityImage({
  src1x,
  src2x,
  src3x,
  alt = "",
  ...rest
}: DensityImageProps) {
  return (
    <img
      src={src1x.src}
      srcSet={densitySrcSet(src1x, src2x, src3x)}
      alt={alt}
      {...rest}
    />
  );
}
