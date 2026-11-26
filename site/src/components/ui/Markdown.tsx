import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

/**
 * Markdown + LaTeX ($...$ e $$...$$) renderizado no servidor.
 * HTML cru é ignorado pelo react-markdown (sem risco de script injetado).
 */
export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  return (
    <div className={`prose-site ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
