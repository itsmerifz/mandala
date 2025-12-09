/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import ReactMarkdown from "react-markdown"
import Image from "next/image"

const renderers = {
  // 1. Link Renderer (Support PDF & External Link)
  a: ({ ...props }: any) => {
    const url = props.href || "";
    const isPdf = url.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      return (
        <span className="my-4 block border rounded-xl overflow-hidden bg-base-200 w-full not-prose">
          <span className="p-2 bg-base-300 text-xs font-bold flex justify-between items-center px-4">
            <span>📄 PDF Attachment</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="link link-primary">Open in New Tab ↗</a>
          </span>
          <iframe src={url} className="w-full h-[500px]" title="PDF Viewer">
            <span className="p-4 text-center block">Unable to display PDF. <a href={url} className="link">Download here</a></span>
          </iframe>
        </span>
      )
    }
    // Link Biasa (Tambahkan styling link DaisyUI)
    return <a {...props} target="_blank" rel="noopener noreferrer" className="link link-primary no-underline hover:underline" />
  },

  // 2. Image Renderer
  // Bungkus dengan span block agar aman dari nesting
  img: ({ ...props }: any) => (
    <span className="block my-4">
      <Image
        {...props}
        width={800} height={500}
        className="max-w-full h-auto rounded-lg border my-2 shadow-sm"
        alt={props.alt || "Content Image"}
      />
    </span>
  ),

  // 3. Paragraph Renderer (PENTING!)
  // Kita ganti <p> dengan <div>. 
  // Kenapa? Karena Markdown sering menaruh Image/Iframe di dalam <p>.
  // HTML melarang <div> ada di dalam <p>. React akan error hydration.
  // Dengan menggantinya jadi <div>, struktur HTML jadi valid walau ada iframe didalamnya.
  p: ({ children }: any) => {
    return <div className="mb-4 leading-relaxed text-base-content">{children}</div>
  }
}

export default function MarkdownView({ content }: { content: string }) {
  if (!content) return null;

  return (
    // Tambahkan 'text-base-content' agar warna teks mengikuti tema
    // Tambahkan 'dark:prose-invert' agar teks putih saat mode gelap
    <div className="prose prose-sm md:prose-base max-w-none text-base-content dark:prose-invert">
      <ReactMarkdown components={renderers}>
        {content}
      </ReactMarkdown>
    </div>
  )
}