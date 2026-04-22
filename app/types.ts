export interface LineItem {
  id: string
  description: string
  note: string
  quantity: number
  unitPrice: number
}

export interface QuoteData {
  title: string
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  quoteNumber: string
  issueDate: string
  validDate: string
  clientName: string
  clientTaxId: string
  clientAddress: string
  clientContact: string
  items: LineItem[]
  taxEnabled: boolean
  taxRate: number
  currency: string
  notes: string
}
