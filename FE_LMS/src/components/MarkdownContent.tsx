import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { ImgHTMLAttributes } from "react";

interface MarkdownContentProps {
  content: string;
  className?: string;
  onImageClick?: (payload: { src: string; alt?: string }) => void;
}

interface MarkdownImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  isClickable: boolean;
  onPreview?: () => void;
}

const MarkdownImage: React.FC<MarkdownImageProps> = ({ isClickable, onPreview, className = "", onLoad, onError, style, ...props }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLoad: ImgHTMLAttributes<HTMLImageElement>["onLoad"] = (event) => {
    setLoaded(true);
    onLoad?.(event);
  };

  const handleError: ImgHTMLAttributes<HTMLImageElement>["onError"] = (event) => {
    setFailed(true);
    onError?.(event);
  };

  const mergedClassName = [
    "max-h-64 w-auto rounded-2xl border border-slate-200 object-contain transition duration-200",
    isClickable ? "cursor-zoom-in hover:shadow-xl" : "",
    loaded ? "opacity-100" : "opacity-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const mergedStyle: React.CSSProperties = {
    maxWidth: "100%",
    ...(style || {}),
  };

  return (
    <figure className="my-4 flex flex-col items-center gap-2 w-full">
      <div className="relative w-full flex justify">
        {!loaded && !failed && (
          <div className="w-full max-w-3xl">
            <div className="h-48 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        )}
        {!failed && (
          <img
            {...props}
            onClick={isClickable ? onPreview : undefined}
            className={mergedClassName}
            style={mergedStyle}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
      {failed && <figcaption className="text-xs text-rose-500">Không thể tải ảnh</figcaption>}
      {!failed && (props.alt || isClickable) && (
        <div className="text-xs flex w-full justify-start text-slate-500">
          {props.alt || "Image"}
          {isClickable ? " • Click to enlarge" : ""}
        </div>
      )}
    </figure>
  );
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = "", onImageClick }) => {
  const components = useMemo<Components>(() => {
    return {
      img({ node, ...props }) {
        const { src = "", alt = "" } = props;
        const isClickable = Boolean(onImageClick && src);
        const handleClick = () => {
          if (isClickable && onImageClick && src) {
            onImageClick({ src, alt });
          }
        };

        return <MarkdownImage {...props} alt={alt} src={src} isClickable={isClickable} onPreview={handleClick} />;
      },
    };
  }, [onImageClick]);

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;

