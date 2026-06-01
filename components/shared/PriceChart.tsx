'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  month: string
  price: number
}

interface Props {
  data: DataPoint[]
  retailPrice?: number
}

export default function PriceChart({ data, retailPrice }: Props) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${v}`} />
          <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Avg Price']} />
          {retailPrice && (
            <Line type="monotone" dataKey={() => retailPrice} stroke="#e5e7eb" strokeDasharray="4 4" dot={false} name="Retail" />
          )}
          <Line type="monotone" dataKey="price" stroke="#E24B4A" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
