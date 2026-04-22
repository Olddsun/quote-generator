'use client'

import { useState, useRef, useEffect } from 'react'
import QuotePreview from './components/QuotePreview'
import type { QuoteData, LineItem, SavedQuote } from './types'

const STORAGE_KEY = 'quote-generator-history'

const today = new Date().toISOString().split('T')[0]
const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

const initialData: QuoteData = {
  title: '報價單',
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  quoteNumber: 'QT-001',
  issueDate: today,
  validDate: thirtyDaysLater,
  clientName: '',
  clientTaxId: '',
  clientAddress: '',
  clientContact: '',
  items: [{ id: '1', description: '', note: '', quantity: 1, unitPrice: 0 }],
  taxEnabled: false,
  taxRate: 5,
  currency: 'NT$',
  notes: '',
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export default function Page() {
  const [data, setData] = useState<QuoteData>(initialData)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [downloading, setDownloading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([])
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSavedQuotes(JSON.parse(stored))
    } catch {}
  }, [])

  function persistQuote(quoteData: QuoteData, total: number) {
    const entry: SavedQuote = {
      id: generateId(),
      savedAt: new Date().toISOString(),
      quoteNumber: quoteData.quoteNumber || '—',
      clientName: quoteData.clientName || '未命名客戶',
      total,
      currency: quoteData.currency,
      data: quoteData,
    }
    const updated = [entry, ...savedQuotes].slice(0, 50)
    setSavedQuotes(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  function loadQuote(entry: SavedQuote) {
    setData(entry.data)
    setHistoryOpen(false)
  }

  function deleteQuote(id: string) {
    const updated = savedQuotes.filter(q => q.id !== id)
    setSavedQuotes(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const tax = data.taxEnabled ? subtotal * (data.taxRate / 100) : 0
  const total = subtotal + tax

  function set<K extends keyof QuoteData>(key: K, value: QuoteData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function addItem() {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { id: generateId(), description: '', note: '', quantity: 1, unitPrice: 0 }],
    }))
  }

  function removeItem(id: string) {
    setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setData(prev => ({
      ...prev,
      items: prev.items.map(i => (i.id === id ? { ...i, [field]: value } : i)),
    }))
  }

  async function downloadPDF() {
    if (!previewRef.current) return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (doc) => {
          const el = doc.querySelector('[data-preview]') as HTMLElement
          if (el) el.style.boxShadow = 'none'
        },
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position -= pdfHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`${data.quoteNumber || '報價單'}.pdf`)
      persistQuote(data, total)
    } catch (err) {
      console.error('PDF 下載失敗', err)
      alert('PDF 下載失敗，請再試一次')
    } finally {
      setDownloading(false)
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition'
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1'
  const sectionClass = 'bg-white rounded-xl p-5 mb-4 shadow-sm'
  const sectionTitle = 'text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 頂部導覽 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">報價單產生器</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              過往報價單
              {savedQuotes.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {savedQuotes.length}
                </span>
              )}
            </button>

            {/* 分頁切換（mobile 用） */}
            <div className="flex bg-gray-100 rounded-lg p-1 lg:hidden">
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                編輯
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                預覽
              </button>
            </div>

            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  產生中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  下載 PDF
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 flex gap-6">
        {/* 左側：編輯表單 */}
        <div className={`w-full lg:w-[420px] flex-shrink-0 ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>

          {/* 報價單設定 */}
          <div className={sectionClass}>
            <div className={sectionTitle}>
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              報價單資訊
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>標題</label>
                <input
                  className={inputClass}
                  value={data.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="報價單"
                />
              </div>
              <div>
                <label className={labelClass}>報價單號</label>
                <input
                  className={inputClass}
                  value={data.quoteNumber}
                  onChange={e => set('quoteNumber', e.target.value)}
                  placeholder="QT-001"
                />
              </div>
              <div>
                <label className={labelClass}>日期</label>
                <input
                  type="date"
                  className={inputClass}
                  value={data.issueDate}
                  onChange={e => set('issueDate', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>有效期限</label>
                <input
                  type="date"
                  className={inputClass}
                  value={data.validDate}
                  onChange={e => set('validDate', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>幣別</label>
                <select
                  className={inputClass}
                  value={data.currency}
                  onChange={e => set('currency', e.target.value)}
                >
                  <option value="NT$">NT$（新台幣）</option>
                  <option value="USD">USD（美元）</option>
                  <option value="JPY">JPY（日圓）</option>
                </select>
              </div>
            </div>
          </div>

          {/* 公司資訊 */}
          <div className={sectionClass}>
            <div className={sectionTitle}>
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              發報價單方（我方）
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>公司 / 個人名稱</label>
                <input className={inputClass} value={data.companyName} onChange={e => set('companyName', e.target.value)} placeholder="你的公司名稱" />
              </div>
              <div>
                <label className={labelClass}>地址</label>
                <input className={inputClass} value={data.companyAddress} onChange={e => set('companyAddress', e.target.value)} placeholder="公司地址" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>電話</label>
                  <input className={inputClass} value={data.companyPhone} onChange={e => set('companyPhone', e.target.value)} placeholder="0900-000-000" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input className={inputClass} value={data.companyEmail} onChange={e => set('companyEmail', e.target.value)} placeholder="email@example.com" />
                </div>
              </div>
            </div>
          </div>

          {/* 客戶資訊 */}
          <div className={sectionClass}>
            <div className={sectionTitle}>
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              報價對象（客戶）
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>公司 / 姓名</label>
                <input className={inputClass} value={data.clientName} onChange={e => set('clientName', e.target.value)} placeholder="客戶名稱" />
              </div>
              <div>
                <label className={labelClass}>統一編號</label>
                <input className={inputClass} value={data.clientTaxId} onChange={e => set('clientTaxId', e.target.value)} placeholder="12345678" maxLength={8} />
              </div>
              <div>
                <label className={labelClass}>地址</label>
                <input className={inputClass} value={data.clientAddress} onChange={e => set('clientAddress', e.target.value)} placeholder="客戶地址" />
              </div>
              <div>
                <label className={labelClass}>聯絡人</label>
                <input className={inputClass} value={data.clientContact} onChange={e => set('clientContact', e.target.value)} placeholder="聯絡人姓名" />
              </div>
            </div>
          </div>

          {/* 工作項目 */}
          <div className={sectionClass}>
            <div className={sectionTitle}>
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              工作項目
            </div>

            <div className="space-y-3">
              {data.items.map((item, index) => (
                <div key={item.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400">項目 {index + 1}</span>
                    {data.items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 transition"
                        title="刪除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className={labelClass}>項目名稱</label>
                      <input
                        className={inputClass}
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="工作項目名稱"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>說明（選填）</label>
                      <textarea
                        className={`${inputClass} resize-none`}
                        rows={2}
                        value={item.note}
                        onChange={e => updateItem(item.id, 'note', e.target.value)}
                        placeholder="項目細節、交付內容等..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>數量</label>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>單價</label>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={item.unitPrice}
                          onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium text-gray-600">
                      小計：{data.currency} {(item.quantity * item.unitPrice).toLocaleString('zh-TW')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addItem}
              className="mt-3 w-full border-2 border-dashed border-gray-200 rounded-lg py-2.5 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增項目
            </button>
          </div>

          {/* 稅率與備註 */}
          <div className={sectionClass}>
            <div className={sectionTitle}>
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              其他設定
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.taxEnabled}
                    onChange={e => set('taxEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">加計營業稅</span>
                </label>
                {data.taxEnabled && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={data.taxRate}
                      onChange={e => set('taxRate', parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                )}
              </div>

              {/* 金額小計 */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>小計</span>
                  <span>{data.currency} {subtotal.toLocaleString('zh-TW')}</span>
                </div>
                {data.taxEnabled && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>營業稅（{data.taxRate}%）</span>
                    <span>{data.currency} {tax.toLocaleString('zh-TW')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-blue-700 pt-1 border-t border-blue-200">
                  <span>總價</span>
                  <span>{data.currency} {total.toLocaleString('zh-TW')}</span>
                </div>
              </div>

              <div>
                <label className={labelClass}>備註</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  value={data.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="付款條件、注意事項等..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右側：即時預覽 */}
        <div className={`flex-1 ${activeTab === 'edit' ? 'hidden lg:block' : ''}`}>
          <div className="sticky top-[72px]">
            <div className="text-xs text-gray-400 mb-3 text-center">預覽（與 PDF 輸出一致）</div>
            <div className="overflow-x-auto">
              <div className="flex justify-start lg:justify-center">
                <div
                  ref={previewRef}
                  data-preview
                  style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
                  className="rounded-sm"
                >
                  <QuotePreview data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 過往報價單抽屜 */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setHistoryOpen(false)}
          />
          {/* 抽屜主體 */}
          <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            {/* 抽屜標題 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">過往報價單</h2>
                <p className="text-xs text-gray-400 mt-0.5">每次下載 PDF 時自動儲存</p>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {savedQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">還沒有儲存的報價單</p>
                  <p className="text-xs">下載 PDF 後會自動出現在這裡</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedQuotes.map((q) => (
                    <div
                      key={q.id}
                      className="group border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/50 transition cursor-pointer"
                      onClick={() => loadQuote(q)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                              {q.quoteNumber}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {q.clientName}
                          </div>
                          <div className="text-base font-bold text-gray-900 mt-1">
                            {q.currency} {q.total.toLocaleString('zh-TW')}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(q.savedAt).toLocaleString('zh-TW', {
                              year: 'numeric', month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteQuote(q.id) }}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition p-1 flex-shrink-0"
                          title="刪除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
