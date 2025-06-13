import { useState, useCallback, useRef } from 'react'
import { Upload, BarChart3, TrendingUp, Target, Download, Calendar, Filter, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import * as XLSX from 'xlsx'
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
  const fileInputRef = useRef(null)
  
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
  
  const handleFileSelect = useCallback((e) => {
    const files = e.target.files
    if (files.length > 0) {
      onFileUpload(files[0])
    }
  }, [onFileUpload])
  
  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])
  
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
      <Button 
        variant="outline" 
        className="border-green-600 text-green-600 hover:bg-green-50"
        onClick={handleButtonClick}
      >
        Selecionar Arquivo
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

// Componente principal da aplicação
function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [generatedBet, setGeneratedBet] = useState(null)
  const [megaSenaData, setMegaSenaData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [frequencies, setFrequencies] = useState({})
  const [combinations, setCombinations] = useState({})
  const [numberAnalysis, setNumberAnalysis] = useState(null)

  // Função para processar arquivo Excel/CSV
  const processFile = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target.result
          let workbook
          
          if (file.name.endsWith(".csv")) {
            // Processar CSV
            const text = new TextDecoder().decode(data)
            const lines = text.split("\n").filter(line => line.trim())
            const headers = lines[0].split(",").map(h => h.trim())
            
            const jsonData = lines.slice(1).map(line => {
              const values = line.split(",").map(v => v.trim())
              const row = {}
              headers.forEach((header, index) => {
                if (header.includes("Bola") || header === "Concurso") {
                  row[header] = parseInt(values[index]) || 0
                } else if (header.includes("Rateio") || header.includes("Acumulado") || header.includes("Arrecadação") || header.includes("Estimativa")) {
                  row[header] = parseFloat(values[index]?.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0
                } else if (header === "Data do Sorteio") {
                  // Tentar parsear a data no formato DD/MM/YYYY
                  const dateParts = values[index].split("/")
                  if (dateParts.length === 3) {
                    row[header] = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`
                  } else {
                    row[header] = values[index]
                  }
                } else {
                  row[header] = values[index] || ""
                }
              })
              return row
            })
            
            resolve(jsonData)
          } else {
            // Processar Excel
            workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[0]
            console.log("Checking data sheetName:", sheetName)
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false })
            
            // Ajustar o formato da data e valores monetários para Excel
            const formattedData = jsonData.map(row => {
              const newRow = { ...row }
              if (newRow["Data do Sorteio"]) {
                // As datas do Excel podem vir como números ou strings
                if (typeof newRow["Data do Sorteio"] === "number") {
                  const date = XLSX.SSF.parse_date_code(newRow["Data do Sorteio"])
                  newRow["Data do Sorteio"] = `${date.d}/${date.m}/${date.y}`
                } else if (typeof newRow["Data do Sorteio"] === "string") {
                  const dateParts = newRow["Data do Sorteio"].split("/")
                  if (dateParts.length === 3) {
                    newRow["Data do Sorteio"] = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`
                  }
                }
              }
              // Tratar colunas de rateio e valores monetários
              ;["Rateio 6 acertos", "Rateio 5 acertos", "Rateio 4 acertos", "Acumulado 6 acertos", "Arrecadação Total", "Estimativa prêmio", "Acumulado Sorteio Especial Mega da Virada"].forEach(col => {
                if (typeof newRow[col] === "string") {
                  newRow[col] = parseFloat(newRow[col].replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0
                }
              })
              return newRow
            })
            resolve(formattedData)
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      
      if (file.name.endsWith('.csv')) {
        reader.readAsArrayBuffer(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }, [])
  
  // Função para validar dados
  const validateData = useCallback((data) => {
    const errors = []
    const requiredColumns = ['Concurso', 'Data do Sorteio', 'Bola1', 'Bola2', 'Bola3', 'Bola4', 'Bola5', 'Bola6']
    
    if (!data || data.length === 0) {
      errors.push('Arquivo vazio ou inválido')
      return errors
    }
    
    // Verificar colunas obrigatórias
    const columns = Object.keys(data[0] || {})
    const missingColumns = requiredColumns.filter(col => !columns.includes(col))
    if (missingColumns.length > 0) {
      errors.push(`Colunas ausentes: ${missingColumns.join(', ')}`)
    }
    
    // Validar algumas linhas
    data.slice(0, 10).forEach((row, index) => {
      const rowNumber = index + 1
      
      // Validar números das bolas
      const balls = [parseFloat(row.Bola1), parseFloat(row.Bola2), parseFloat(row.Bola3), parseFloat(row.Bola4), parseFloat(row.Bola5), parseFloat(row.Bola6)]
      const validBalls = balls.filter(ball => Number.isInteger(ball) && ball >= 1 && ball <= 60)
      
      if (validBalls.length !== 6) {
        errors.push(`Linha ${rowNumber}: Números inválidos encontrados`)
      }
      
      // Verificar duplicatas
      const uniqueBalls = new Set(balls)
      if (uniqueBalls.size !== 6) {
        errors.push(`Linha ${rowNumber}: Números duplicados encontrados`)
      }
    })
    
    return errors
  }, [])
  
  // Função para calcular frequências
  const calculateFrequencies = useCallback((data) => {
    const freq = {}
    
    // Inicializar contadores
    for (let i = 1; i <= 60; i++) {
      freq[i] = 0
    }
    
    // Contar frequências
    data.forEach(row => {
      [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6].forEach(ball => {
        if (ball >= 1 && ball <= 60) {
          freq[ball]++
        }
      })
    })
    
    return freq
  }, [])
  
  // Função para calcular combinações
  const calculateCombinations = useCallback((data, size = 2) => {
    const combos = {}
    
    const getCombinations = (arr, size) => {
      if (size === 1) return arr.map(x => [x])
      if (size === arr.length) return [arr]
      
      const result = []
      for (let i = 0; i <= arr.length - size; i++) {
        const head = arr[i]
        const tailCombos = getCombinations(arr.slice(i + 1), size - 1)
        tailCombos.forEach(combo => result.push([head, ...combo]))
      }
      
      return result
    }
    
    data.forEach(row => {
      const balls = [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6].sort((a, b) => a - b)
      
      // Gerar todas as combinações do tamanho especificado
      const combinations = getCombinations(balls, size)
      combinations.forEach(combo => {
        const key = combo.join(',')
        combos[key] = (combos[key] || 0) + 1
      })
    })
    
    return combos
  }, [])
  
  // Função para analisar números selecionados
  const analyzeSelectedNumbers = useCallback(() => {
    if (!megaSenaData || selectedNumbers.length < 6) return

    console.log('Analisando números selecionados:', selectedNumbers)
    
    const analysis = {
      selectedNumbers,
      frequencies: {},
      combinations: {},
      exactMatches: 0
    }
    
    // Calcular frequência individual
    selectedNumbers.forEach(num => {
      analysis.frequencies[num] = megaSenaData.filter(row => 
        [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6].includes(num)
      ).length
    })
    
    // Calcular combinações
    for (let size = 2; size <= Math.min(selectedNumbers.length, 5); size++) {
      const getCombinations = (arr, size) => {
        if (size === 1) return arr.map(x => [x])
        if (size === arr.length) return [arr]
        
        const result = []
        for (let i = 0; i <= arr.length - size; i++) {
          const head = arr[i]
          const tailCombos = getCombinations(arr.slice(i + 1), size - 1)
          tailCombos.forEach(combo => result.push([head, ...combo]))
        }
        
        return result
      }
      
      const combos = getCombinations(selectedNumbers.sort((a, b) => a - b), size)
      analysis.combinations[size] = {}
      
      combos.forEach(combo => {
        const key = combo.join(',')
        analysis.combinations[size][key] = megaSenaData.filter(row => {
          const balls = [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6]
          return combo.every(num => balls.includes(num))
        }).length
      })
    }
    
    // Verificar matches exatos (apenas para 6 números)
    if (selectedNumbers.length === 6) {
      const sortedSelected = selectedNumbers.sort((a, b) => a - b)
      analysis.exactMatches = megaSenaData.filter(row => {
        const balls = [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6].sort((a, b) => a - b)
        return JSON.stringify(balls) === JSON.stringify(sortedSelected)
      }).length
    }
    
    setNumberAnalysis(analysis)
  }, [megaSenaData, selectedNumbers])
  
  // Dados mockados para demonstração quando não há arquivo carregado
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
  
  // Usar dados reais se disponíveis, senão usar mock
  // const currentData = megaSenaData || []
  const currentStats = megaSenaData ? {
    totalDraws: megaSenaData.length,
    mostFrequent: Object.entries(frequencies)
      .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 30),
    leastFrequent: Object.entries(frequencies)
      .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
      .sort((a, b) => a.frequency - b.frequency)
      .slice(0, 30)
  } : mockStats
  
  const handleFileUpload = useCallback(async (file) => {
    setUploadedFile(file)
    setIsProcessing(true)
    setValidationErrors([])
    
    try {
      console.log('Processando arquivo:', file.name)
      
      // Processar arquivo
      const data = await processFile(file)
      console.log(data)
      console.log('Dados processados:', data.length, 'registros')
      
      // Validar dados
      const errors = validateData(data)
      if (errors.length > 0) {
        setValidationErrors(errors)
        setIsProcessing(false)
        return
      }
      
      // Calcular estatísticas
      const freq = calculateFrequencies(data)
      const combos2 = calculateCombinations(data, 2)
      const combos3 = calculateCombinations(data, 3)
      const combos4 = calculateCombinations(data, 4)
      const combos5 = calculateCombinations(data, 5)
      
      // Atualizar estado
      setMegaSenaData(data)
      setFrequencies(freq)
      setCombinations({
        pairs: combos2,
        trios: combos3,
        quartets: combos4,
        quintets: combos5
      })
      
      console.log('Dados carregados com sucesso!')
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setValidationErrors([`Erro ao processar arquivo: ${error.message}`])
    } finally {
      setIsProcessing(false)
    }
  }, [processFile, validateData, calculateFrequencies, calculateCombinations])
  
  const toggleNumber = useCallback((number) => {
    setSelectedNumbers(prev => 
      prev.includes(number) 
        ? prev.filter(n => n !== number)
        : prev.length < 8 ? [...prev, number] : prev
    )
  }, [])
  
  const handleGenerateBet = useCallback(() => {
    if (!megaSenaData || megaSenaData.length === 0) {
      // Gerar aposta aleatória simples se não há dados
      const numbers = new Set()
      while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 60) + 1)
      }
      setGeneratedBet(Array.from(numbers).sort((a, b) => a - b))
      return
    }
    
    // Gerar aposta inteligente baseada nos dados
    const freqEntries = Object.entries(frequencies)
      .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency)
    
    const hotNumbers = freqEntries.slice(0, 20).map(item => item.number)
    const coldNumbers = freqEntries.slice(-20).map(item => item.number)
    
    const numbers = new Set()
    
    // Adicionar 3-4 números quentes
    const hotCount = Math.floor(Math.random() * 2) + 3 // 3 ou 4
    for (let i = 0; i < hotCount && numbers.size < 6; i++) {
      const randomHot = hotNumbers[Math.floor(Math.random() * hotNumbers.length)]
      numbers.add(randomHot)
    }
    
    // Adicionar 2-3 números frios
    while (numbers.size < 6) {
      const randomCold = coldNumbers[Math.floor(Math.random() * coldNumbers.length)]
      numbers.add(randomCold)
    }
    
    setGeneratedBet(Array.from(numbers).sort((a, b) => a - b))
  }, [megaSenaData, frequencies])
  
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
                    {isProcessing ? (
                      <div>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="font-medium text-gray-700">Processando...</p>
                        <p className="text-sm text-gray-500">{uploadedFile.name}</p>
                      </div>
                    ) : validationErrors.length > 0 ? (
                      <div>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="font-medium text-red-700">Erro na Validação</p>
                        <div className="mt-2 space-y-1">
                          {validationErrors.map((error, index) => (
                            <Alert key={index} className="text-left">
                              <AlertDescription className="text-sm">{error}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          className="mt-3" 
                          onClick={() => {
                            setUploadedFile(null)
                            setValidationErrors([])
                          }}
                        >
                          Tentar Novamente
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="font-medium text-gray-700">Dados Carregados</p>
                        <p className="text-sm text-gray-500">{currentStats.totalDraws} sorteios</p>
                        <p className="text-xs text-gray-400 mt-1">{uploadedFile.name}</p>
                      </div>
                    )}
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
                <TabsTrigger value="generator">Estatísticas</TabsTrigger>
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
                      <div className="text-2xl font-bold text-green-600">{currentStats.totalDraws}</div>
                      <p className="text-xs text-muted-foreground">Desde 1996</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Números Quentes</CardTitle>
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">30</div>
                      <p className="text-xs text-muted-foreground">Mais frequentes</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Números Frios</CardTitle>
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">30</div>
                      <p className="text-xs text-muted-foreground">Menos frequentes</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Números Mais e Menos Frequentes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Números Mais Frequentes</CardTitle>
                      <CardDescription>Top números mais sorteados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 pt-2 max-h-90 overflow-y-auto">
                        {currentStats.mostFrequent.map(({ number, frequency }) => (
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
                      <CardDescription>Top números menos sorteados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 pt-2 max-h-90 overflow-y-auto">
                        {currentStats.leastFrequent.map(({ number, frequency }) => (
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
                              key={`number-${String(number)}`}
                              onClick={() => toggleNumber(String(number))}
                              className={`
                                w-8 h-8 rounded text-xs font-medium transition-all duration-200
                                ${selectedNumbers.includes(String(number)) 
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
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={analyzeSelectedNumbers}
                          disabled={!megaSenaData}
                        >
                          {!megaSenaData ? 'Carregue dados para analisar' : 'Analisar Combinação'}
                        </Button>
                      )}
                      
                      {numberAnalysis && (
                        <div className="mt-6 space-y-4">
                          <h3 className="text-lg font-semibold">Resultado da Análise</h3>
                          
                          {/* Frequências Individuais */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Frequências Individuais</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(numberAnalysis.frequencies).map(([num, freq]) => (
                                  <div key={num} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span className="font-medium">Número {num}:</span>
                                    <span className="text-blue-600">{freq} vezes</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Combinações */}
                          {Object.entries(numberAnalysis.combinations).map(([size, combos]) => (
                            <Card key={size}>
                              <CardHeader>
                                <CardTitle className="text-base">
                                  {size === '2' ? 'Pares' : size === '3' ? 'Trios' : size === '4' ? 'Quartetos' : 'Quintetos'}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                  {Object.entries(combos).sort((a, b) => b[1] - a[1]).map(([combo, freq]) => (
                                    <div key={combo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <span className="font-medium">[{combo}]:</span>
                                      <span className="text-blue-600">{freq} vezes</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          
                          {/* Matches Exatos */}
                          {numberAnalysis.exactMatches !== undefined && (
                            <Alert>
                              <AlertDescription>
                                <strong>Combinação exata:</strong> Esta combinação já saiu {numberAnalysis.exactMatches} vez(es) na história da Mega-Sena.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Generator Tab */}
              <TabsContent value="generator" className="space-y-6">
                {/* Rankings de Combinações */}
                {megaSenaData && combinations && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top 50 Pares */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top 50 Pares Mais Frequentes</CardTitle>
                        <CardDescription>Combinações de 2 números que mais saíram</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {Object.entries(combinations.pairs || {})
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 50)
                            .map(([combo, freq], index) => (
                              <div key={combo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium">#{index + 1} [{combo}]</span>
                                <span className="text-green-600 font-bold">{freq}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bottom 50 Pares */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Bottom 50 Pares Menos Frequentes</CardTitle>
                        <CardDescription>Combinações de 2 números que menos saíram</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {Object.entries(combinations.pairs || {})
                            .sort(([,a], [,b]) => a - b)
                            .slice(0, 50)
                            .map(([combo, freq], index) => (
                              <div key={combo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium">#{index + 1} [{combo}]</span>
                                <span className="text-red-600 font-bold">{freq}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top 50 Trios */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top 50 Trios Mais Frequentes</CardTitle>
                        <CardDescription>Combinações de 3 números que mais saíram</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {Object.entries(combinations.trios || {})
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 50)
                            .map(([combo, freq], index) => (
                              <div key={combo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium">#{index + 1} [{combo}]</span>
                                <span className="text-green-600 font-bold">{freq}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bottom 50 Trios */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Bottom 50 Trios Menos Frequentes</CardTitle>
                        <CardDescription>Combinações de 3 números que menos saíram</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {Object.entries(combinations.trios || {})
                            .sort(([,a], [,b]) => a - b)
                            .slice(0, 50)
                            .map(([combo, freq], index) => (
                              <div key={combo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium">#{index + 1} [{combo}]</span>
                                <span className="text-red-600 font-bold">{freq}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top 50 Quartetos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top 50 Quartetos Mais Frequentes</CardTitle>
                        <CardDescription>Combinações de 4 números que mais saíram</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {Object.entries(combinations.quartets || {})
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 50)
                            .map(([combo, freq], index) => (
                              <div key={combo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium">#{index + 1} [{combo}]</span>
                                <span className="text-green-600 font-bold">{freq}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top 50 Quintetos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top 50 Quintetos Mais Frequentes</CardTitle>
                        <CardDescription>Combinações de 5 números que mais saíram</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {Object.entries(combinations.quintets || {})
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 50)
                            .map(([combo, freq], index) => (
                              <div key={combo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium">#{index + 1} [{combo}]</span>
                                <span className="text-green-600 font-bold">{freq}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!megaSenaData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rankings de Combinações</CardTitle>
                      <CardDescription>
                        Carregue um arquivo de dados para visualizar os rankings de pares, trios, quartetos e quintetos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Rankings Indisponíveis
                        </p>
                        <p className="text-sm text-gray-500">
                          Carregue dados da Mega-Sena para ver os rankings detalhados
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                {megaSenaData && megaSenaData.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Histórico de Resultados</CardTitle>
                      <CardDescription>
                        Últimos {Math.min(50, megaSenaData.length)} sorteios da Mega-Sena
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {megaSenaData.slice(-50).reverse().map((draw, index) => (
                          <div key={draw.Concurso || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium text-gray-600">
                                #{draw.Concurso}
                              </div>
                              <div className="text-sm text-gray-500">
                                {draw['Data do Sorteio']}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {[draw.Bola1, draw.Bola2, draw.Bola3, draw.Bola4, draw.Bola5, draw.Bola6].map((ball, ballIndex) => (
                                <div 
                                  key={ballIndex}
                                  className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
                                >
                                  {ball}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {megaSenaData.length > 50 && (
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-500">
                            Mostrando 50 de {megaSenaData.length} sorteios
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
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
                          Histórico Indisponível
                        </p>
                        <p className="text-sm text-gray-500">
                          Carregue um arquivo Excel para visualizar o histórico completo
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

