'use client'

import { forwardRef } from 'react'
import type { QuoteData } from '../types'

interface Props {
  data: QuoteData
}

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('zh-TW')}`
}

const QuotePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tax = data.taxEnabled ? subtotal * (data.taxRate / 100) : 0
  const total = subtotal + tax

  return (
    <div
      ref={ref}
      style={{
        width: '794px',
        minHeight: '1123px',
        background: '#fff',
        padding: '64px 72px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang TC', 'Noto Sans TC', sans-serif",
        color: '#1a1a1a',
        fontSize: '14px',
        lineHeight: '1.6',
      }}
    >
      {/* 頁首：公司資訊 + 報價單標題 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '6px' }}>
            {data.companyName || '公司名稱'}
          </div>
          {data.companyAddress && (
            <div style={{ color: '#555', fontSize: '13px', marginBottom: '2px' }}>{data.companyAddress}</div>
          )}
          {data.companyPhone && (
            <div style={{ color: '#555', fontSize: '13px', marginBottom: '2px' }}>電話：{data.companyPhone}</div>
          )}
          {data.companyEmail && (
            <div style={{ color: '#555', fontSize: '13px' }}>Email：{data.companyEmail}</div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb', marginBottom: '12px' }}>
            {data.title}
          </div>
          <table style={{ marginLeft: 'auto', fontSize: '13px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: '#888', paddingRight: '16px', paddingBottom: '4px' }}>單號</td>
                <td style={{ fontWeight: '600', paddingBottom: '4px' }}>{data.quoteNumber}</td>
              </tr>
              <tr>
                <td style={{ color: '#888', paddingRight: '16px', paddingBottom: '4px' }}>日期</td>
                <td style={{ paddingBottom: '4px' }}>{data.issueDate}</td>
              </tr>
              {data.validDate && (
                <tr>
                  <td style={{ color: '#888', paddingRight: '16px' }}>有效期限</td>
                  <td>{data.validDate}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分隔線 */}
      <div style={{ height: '2px', background: '#2563eb', marginBottom: '32px', borderRadius: '1px' }} />

      {/* 客戶資訊 */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
          報價對象
        </div>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
          {data.clientName || '客戶名稱'}
        </div>
        {data.clientAddress && (
          <div style={{ color: '#555', fontSize: '13px', marginBottom: '2px' }}>{data.clientAddress}</div>
        )}
        {data.clientContact && (
          <div style={{ color: '#555', fontSize: '13px' }}>聯絡人：{data.clientContact}</div>
        )}
      </div>

      {/* 項目表格 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: '600', color: '#475569', width: '45%' }}>
              工作項目
            </th>
            <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: '12px', fontWeight: '600', color: '#475569', width: '15%' }}>
              數量
            </th>
            <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '12px', fontWeight: '600', color: '#475569', width: '20%' }}>
              單價
            </th>
            <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: '12px', fontWeight: '600', color: '#475569', width: '20%' }}>
              小計
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr
              key={item.id}
              style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? '#fff' : '#fafafa' }}
            >
              <td style={{ padding: '12px 14px', fontSize: '14px' }}>
                {item.description || '—'}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '14px', color: '#555' }}>
                {item.quantity}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', color: '#555' }}>
                {formatCurrency(item.unitPrice, data.currency)}
              </td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                {formatCurrency(item.quantity * item.unitPrice, data.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 金額合計 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
        <div style={{ width: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
            <span style={{ color: '#555' }}>小計</span>
            <span>{formatCurrency(subtotal, data.currency)}</span>
          </div>
          {data.taxEnabled && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
              <span style={{ color: '#555' }}>營業稅（{data.taxRate}%）</span>
              <span>{formatCurrency(tax, data.currency)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '17px', fontWeight: '700' }}>
            <span>總價</span>
            <span style={{ color: '#2563eb' }}>{formatCurrency(total, data.currency)}</span>
          </div>
        </div>
      </div>

      {/* 備註 */}
      {data.notes && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', letterSpacing: '0.1em', marginBottom: '8px' }}>
            備註
          </div>
          <div style={{ fontSize: '13px', color: '#555', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
            {data.notes}
          </div>
        </div>
      )}
    </div>
  )
})

QuotePreview.displayName = 'QuotePreview'

export default QuotePreview
