import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer" />
  ),
}

/** Renders untrusted Markdown (e.g. model output). Raw HTML is not rendered. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm prose-neutral max-w-none [--tw-prose-body:var(--color-neutral-900)] prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-a:text-blue-700 prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
