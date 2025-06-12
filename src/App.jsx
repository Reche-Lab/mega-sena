import { useState, useCallback } from 'react'
import { Upload, BarChart3, TrendingUp, Target, Download, Calendar, Filter, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import './App.css'

// Componente para as bolas da Mega-Sena
const LotteryBall = ({ number, frequency = 0, isHot = false }) => (
  <div className={`
    relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm
    transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer
    ${isHot ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-300/50' : 'bg-gradient-to-br from-green-600 to-green-800 shadow-green-300/30'}
    shadow-lg border-2 border-white/20
  `}>
    <span className="relative z-10">{number}</span>
    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-white/20"></div>
    {frequency > 0 && (
      <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {frequency}
      </div>
    )}
  </div>
)

// Componente para upload de arquivo
const FileUpload = ({ onFileUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])
  
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileUpload(files[0])
    }
  }, [onFileUpload])
  
  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
        ${isDragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-700 mb-2">
        Arraste seu arquivo Excel aqui
      </p>
      <p className="text-sm text-gray-500 mb-4">
        ou clique para selecionar
      </p>
      <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
        Selecionar Arquivo
      </Button>
    </div>
  )
}

// Componente principal da aplicação
function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [generatedBet, setGeneratedBet] = useState(null)
  
  // Dados simplificados para demonstração
  const mockStats = {
    totalDraws: 2756,
    mostFrequent: [
      { number: 10, frequency: 89 },
      { number: 5, frequency: 87 },
      { number: 23, frequency: 85 },
      { number: 33, frequency: 83 },
      { number: 42, frequency: 81 },
      { number: 17, frequency: 79 }
    ],
    leastFrequent: [
      { number: 26, frequency: 45 },
      { number: 21, frequency: 47 },
      { number: 7, frequency: 49 },
      { number: 50, frequency: 51 },
      { number: 13, frequency: 53 },
      { number: 35, frequency: 55 }
    ]
  }
  
  const handleFileUpload = useCallback((file) => {
    setUploadedFile(file)
    console.log('Arquivo carregado:', file.name)
  }, [])
  
  const toggleNumber = useCallback((number) => {
    setSelectedNumbers(prev => 
      prev.includes(number) 
        ? prev.filter(n => n !== number)
        : prev.length < 8 ? [...prev, number] : prev
    )
  }, [])
  
  const handleGenerateBet = useCallback(() => {
    // Gerar uma aposta aleatória simples
    const numbers = new Set()
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 60) + 1)
    }
    setGeneratedBet(Array.from(numbers).sort((a, b) => a - b))
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mega-Sena Analytics</h1>
                <p className="text-green-100 text-sm">Análise Inteligente de Estatísticas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {uploadedFile && (
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {uploadedFile.name}
                </Badge>
              )}
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload de Arquivo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-green-600" />
                  Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!uploadedFile ? (
                  <FileUpload onFileUpload={handleFileUpload} />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-700">Dados Carregados</p>
                    <p className="text-sm text-gray-500">{mockStats.totalDraws} sorteios</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-blue-600" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dateRange">Período</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input type="date" className="text-sm" />
                    <Input type="date" className="text-sm" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="drawCount">Últimos Sorteios</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">Últimos 50</SelectItem>
                      <SelectItem value="100">Últimos 100</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Gerador de Combinações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-600" />
                  Gerador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input type="number" placeholder="2" min="1" max="5" className="w-16" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="pares top" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pairs">pares top</SelectItem>
                      <SelectItem value="trios">trios freq.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-center text-sm text-gray-500">+</div>
                
                <div className="flex space-x-2">
                  <Input type="number" placeholder="3" min="1" max="5" className="w-16" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="frios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold">Frios</SelectItem>
                      <SelectItem value="overdue">Atrasados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" onClick={handleGenerateBet}>
                  Gerar Aposta
                </Button>
                
                {generatedBet && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Aposta Gerada:</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedBet.map(number => (
                        <div key={number} className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {number}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="analysis">Análise</TabsTrigger>
                <TabsTrigger value="generator">Gerador</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Sorteios</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{mockStats.totalDraws}</div>
                      <p className="text-xs text-muted-foreground">Desde 1996</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Números Quentes</CardTitle>
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">6</div>
                      <p className="text-xs text-muted-foreground">Mais frequentes</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Números Frios</CardTitle>
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">6</div>
                      <p className="text-xs text-muted-foreground">Menos frequentes</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Números Mais e Menos Frequentes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Números Mais Frequentes</CardTitle>
                      <CardDescription>Top 6 números mais sorteados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        {mockStats.mostFrequent.map(({ number, frequency }) => (
                          <LotteryBall 
                            key={`hot-${number}`}
                            number={number} 
                            frequency={frequency}
                            isHot={true}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Números Menos Frequentes</CardTitle>
                      <CardDescription>Top 6 números menos sorteados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        {mockStats.leastFrequent.map(({ number, frequency }) => (
                          <LotteryBall 
                            key={`cold-${number}`}
                            number={number} 
                            frequency={frequency}
                            isHot={false}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Análise de Números Personalizados</CardTitle>
                    <CardDescription>
                      Selecione de 6 a 8 números para análise detalhada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Números Selecionados ({selectedNumbers.length}/8)</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedNumbers.map(number => (
                            <Badge 
                              key={`selected-${number}`}
                              variant="secondary" 
                              className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
                              onClick={() => toggleNumber(number)}
                            >
                              {number} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Selecionar Números (1-60)</Label>
                        <div className="grid grid-cols-10 gap-2 mt-2">
                          {Array.from({length: 60}, (_, i) => i + 1).map(number => (
                            <button
                              key={`number-${number}`}
                              onClick={() => toggleNumber(number)}
                              className={`
                                w-8 h-8 rounded text-xs font-medium transition-all duration-200
                                ${selectedNumbers.includes(number) 
                                  ? 'bg-green-600 text-white shadow-md' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                              `}
                            >
                              {number}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {selectedNumbers.length >= 6 && (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Analisar Combinação
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Generator Tab */}
              <TabsContent value="generator" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gerador de Apostas Inteligente</CardTitle>
                    <CardDescription>
                      Configure as regras para gerar combinações otimizadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Gerador Avançado
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Use o gerador na barra lateral para criar apostas básicas
                      </p>
                      <Button onClick={handleGenerateBet} className="bg-green-600 hover:bg-green-700">
                        Gerar Nova Aposta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico de Resultados</CardTitle>
                    <CardDescription>
                      Visualize os últimos sorteios da Mega-Sena
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Histórico Completo
                      </p>
                      <p className="text-sm text-gray-500">
                        Carregue um arquivo Excel para visualizar o histórico completo
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

