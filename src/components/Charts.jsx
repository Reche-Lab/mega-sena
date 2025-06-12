import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

// Paleta de cores da Mega-Sena
const COLORS = {
  primary: '#00A859',
  secondary: '#007A42',
  accent: '#FFD700',
  hot: '#FF6B35',
  cold: '#4A90E2',
  background: '#F8FAFC'
}

const CHART_COLORS = [
  '#00A859', '#007A42', '#FFD700', '#FF6B35', '#4A90E2', 
  '#8B5CF6', '#EF4444', '#F59E0B', '#10B981', '#3B82F6'
]

// Componente para gráfico de frequência de números
export const FrequencyChart = ({ data, title, type = 'bar' }) => {
  const chartData = Object.entries(data).map(([number, frequency]) => ({
    number: parseInt(number),
    frequency,
    fill: frequency > 50 ? COLORS.hot : frequency < 30 ? COLORS.cold : COLORS.primary
  }))

  if (type === 'pie') {
    return (
      <div className="w-full h-80">
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData.slice(0, 10)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ number, frequency }) => `${number}: ${frequency}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="frequency"
            >
              {chartData.slice(0, 10).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-full h-80">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="number" 
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value, name) => [value, 'Frequência']}
            labelFormatter={(label) => `Número: ${label}`}
          />
          <Bar 
            dataKey="frequency" 
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Componente para heatmap de combinações
export const CombinationHeatmap = ({ combinations, title }) => {
  const data = Object.entries(combinations)
    .map(([combo, frequency]) => ({
      combination: combo,
      frequency,
      numbers: combo.split(',').map(Number)
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20)

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map(({ combination, frequency, numbers }, index) => (
          <div 
            key={combination}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border"
          >
            <div className="flex space-x-2">
              {numbers.map(num => (
                <div 
                  key={num}
                  className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold"
                >
                  {num}
                </div>
              ))}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">{frequency}</div>
              <div className="text-xs text-gray-500">vezes</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente para gráfico de linha temporal
export const TimelineChart = ({ data, title }) => {
  const chartData = data.map(row => ({
    concurso: row.Concurso,
    date: row['Data do Sorteio'],
    sum: row.Bola1 + row.Bola2 + row.Bola3 + row.Bola4 + row.Bola5 + row.Bola6,
    highest: Math.max(row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6),
    lowest: Math.min(row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6)
  })).slice(-50) // Últimos 50 sorteios

  return (
    <div className="w-full h-80">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="concurso" 
            tick={{ fontSize: 10 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value, name) => [value, name === 'sum' ? 'Soma' : name === 'highest' ? 'Maior' : 'Menor']}
            labelFormatter={(label) => `Concurso: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="sum" 
            stroke={COLORS.primary} 
            strokeWidth={2}
            dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="highest" 
            stroke={COLORS.hot} 
            strokeWidth={2}
            dot={{ fill: COLORS.hot, strokeWidth: 2, r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="lowest" 
            stroke={COLORS.cold} 
            strokeWidth={2}
            dot={{ fill: COLORS.cold, strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Componente para estatísticas resumidas
export const StatsCards = ({ data }) => {
  if (!data || data.length === 0) return null

  const totalDraws = data.length
  const allNumbers = data.flatMap(row => [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6])
  const avgSum = allNumbers.reduce((sum, num) => sum + num, 0) / allNumbers.length * 6
  const mostCommon = allNumbers.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1
    return acc
  }, {})
  
  const topNumber = Object.entries(mostCommon).reduce((a, b) => mostCommon[a[0]] > mostCommon[b[0]] ? a : b)[0]
  const topFreq = mostCommon[topNumber]

  const stats = [
    {
      title: 'Total de Sorteios',
      value: totalDraws.toLocaleString(),
      subtitle: 'Desde 1996',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Número Mais Sorteado',
      value: topNumber,
      subtitle: `${topFreq} vezes`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Soma Média',
      value: Math.round(avgSum),
      subtitle: 'Por sorteio',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Último Sorteio',
      value: `#${data[data.length - 1]?.Concurso || 'N/A'}`,
      subtitle: data[data.length - 1]?.['Data do Sorteio'] || 'N/A',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-lg p-4 border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Componente para análise de números selecionados
export const NumberAnalysisDisplay = ({ analysis }) => {
  if (!analysis) return null

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Frequência Individual</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(analysis.frequencies).map(([number, frequency]) => (
            <div key={number} className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-full flex items-center justify-center font-bold mb-2 mx-auto">
                {number}
              </div>
              <div className="text-sm">
                <div className="font-semibold">{frequency}</div>
                <div className="text-gray-500 text-xs">vezes</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {Object.entries(analysis.combinations).map(([size, combos]) => (
        <div key={size} className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">
            Combinações de {size} números
          </h3>
          <div className="space-y-3">
            {Object.entries(combos).slice(0, 10).map(([combo, frequency]) => (
              <div key={combo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex space-x-2">
                  {combo.split(',').map(num => (
                    <span key={num} className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {num}
                    </span>
                  ))}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{frequency}</div>
                  <div className="text-xs text-gray-500">aparições</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {analysis.selectedNumbers.length === 6 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Match Exato</h3>
          <div className="text-center">
            {analysis.exactMatches > 0 ? (
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">{analysis.exactMatches}</div>
                <div className="text-gray-600">Esta combinação já foi sorteada!</div>
              </div>
            ) : (
              <div>
                <div className="text-3xl font-bold text-gray-400 mb-2">0</div>
                <div className="text-gray-600">Esta combinação nunca foi sorteada</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

