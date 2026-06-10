"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="prose-product max-w-none text-[15px] leading-7 text-white/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline underline-offset-2" />
          ),
          img: (props) => {
            // The agent emits raw <img> via rehype-raw; this catches markdown ![]() too.
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                {...props}
                alt={props.alt || ""}
                loading="lazy"
                className="rounded-xl border border-white/10 max-w-[260px] h-auto object-contain bg-white/5"
              />
            );
          },
          h3: (props) => <h3 className="mt-5 mb-1 text-base font-semibold text-white" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-2 border-white/20 pl-3 my-2 italic text-white/75" {...props} />
          ),
          hr: () => <hr className="border-white/10 my-5" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
