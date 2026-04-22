import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '報價單產生器',
  description: '快速建立專業報價單並匯出 PDF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  )
}
