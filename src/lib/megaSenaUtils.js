// Utilitários para processamento de dados da Mega-Sena
export const validateExcelData = (data) => {
  const errors = []
  const requiredColumns = ['Concurso', 'Data do Sorteio', 'Bola1', 'Bola2', 'Bola3', 'Bola4', 'Bola5', 'Bola6']
  
  // Verificar colunas obrigatórias
  const columns = Object.keys(data[0] || {})
  const missingColumns = requiredColumns.filter(col => !columns.includes(col))
  if (missingColumns.length > 0) {
    errors.push(`Colunas ausentes: ${missingColumns.join(', ')}`)
  }
  
  // Validar cada linha
  data.forEach((row, index) => {
    const rowNumber = index + 1
    
    // Validar concurso
    if (!Number.isInteger(row.Concurso) || row.Concurso <= 0) {
      errors.push(`Linha ${rowNumber}: Concurso deve ser um número inteiro positivo`)
    }
    
    // Validar data
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
    if (!dateRegex.test(row['Data do Sorteio'])) {
      errors.push(`Linha ${rowNumber}: Data inválida - deve estar no formato DD/MM/AAAA`)
    } else {
      const [day, month, year] = row['Data do Sorteio'].split('/')
      const date = new Date(year, month - 1, day)
      if (date > new Date()) {
        errors.push(`Linha ${rowNumber}: Data não pode ser futura`)
      }
    }
    
    // Validar números das bolas
    const balls = [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6]
    const validBalls = balls.filter(ball => Number.isInteger(ball) && ball >= 1 && ball <= 60)
    
    if (validBalls.length !== 6) {
      errors.push(`Linha ${rowNumber}: Todos os números devem ser inteiros entre 1 e 60`)
    }
    
    // Verificar duplicatas
    const uniqueBalls = new Set(balls)
    if (uniqueBalls.size !== 6) {
      errors.push(`Linha ${rowNumber}: Números duplicados encontrados`)
    }
  })
  
  return errors
}

export const calculateFrequencies = (data) => {
  const frequencies = {}
  
  // Inicializar contadores
  for (let i = 1; i <= 60; i++) {
    frequencies[i] = 0
  }
  
  // Contar frequências
  data.forEach(row => {
    [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6].forEach(ball => {
      if (ball >= 1 && ball <= 60) {
        frequencies[ball]++
      }
    })
  })
  
  return frequencies
}

export const calculateCombinations = (data, size = 2) => {
  const combinations = {}
  
  data.forEach(row => {
    const balls = [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6].sort((a, b) => a - b)
    
    // Gerar todas as combinações do tamanho especificado
    const combos = getCombinations(balls, size)
    combos.forEach(combo => {
      const key = combo.join(',')
      combinations[key] = (combinations[key] || 0) + 1
    })
  })
  
  return combinations
}

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

export const analyzeNumbers = (selectedNumbers, data) => {
  if (!data || data.length === 0) return null
  
  const analysis = {
    selectedNumbers,
    frequencies: {},
    combinations: {},
    exactMatches: 0,
    partialMatches: {}
  }
  
  // Calcular frequência individual
  selectedNumbers.forEach(num => {
    analysis.frequencies[num] = data.filter(row => 
      [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6].includes(num)
    ).length
  })
  
  // Calcular combinações
  for (let size = 2; size <= Math.min(selectedNumbers.length, 5); size++) {
    const combos = getCombinations(selectedNumbers.sort((a, b) => a - b), size)
    analysis.combinations[size] = {}
    
    combos.forEach(combo => {
      const key = combo.join(',')
      analysis.combinations[size][key] = data.filter(row => {
        const balls = [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6]
        return combo.every(num => balls.includes(num))
      }).length
    })
  }
  
  // Verificar matches exatos (apenas para 6 números)
  if (selectedNumbers.length === 6) {
    const sortedSelected = selectedNumbers.sort((a, b) => a - b)
    analysis.exactMatches = data.filter(row => {
      const balls = [row.Bola1, row.Bola2, row.Bola3, row.Bola4, row.Bola5, row.Bola6].sort((a, b) => a - b)
      return JSON.stringify(balls) === JSON.stringify(sortedSelected)
    }).length
  }
  
  return analysis
}

export const generateBet = (config, data) => {
  if (!data || data.length === 0) return null
  
  const frequencies = calculateFrequencies(data)
  const combinations = calculateCombinations(data, config.comboSize || 2)
  
  // Obter números mais frequentes ou combinações
  let selectedNumbers = []
  
  if (config.useTopCombos) {
    const topCombos = Object.entries(combinations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, config.topCount || 3)
      .map(([combo]) => combo.split(',').map(Number))
    
    topCombos.forEach(combo => {
      combo.forEach(num => {
        if (!selectedNumbers.includes(num)) {
          selectedNumbers.push(num)
        }
      })
    })
  }
  
  // Adicionar números frios/atrasados
  if (config.useColdNumbers) {
    const sortedByFreq = Object.entries(frequencies)
      .sort(([,a], [,b]) => a - b)
      .map(([num]) => parseInt(num))
    
    let coldCount = 0
    for (const num of sortedByFreq) {
      if (!selectedNumbers.includes(num) && coldCount < (config.coldCount || 3)) {
        selectedNumbers.push(num)
        coldCount++
      }
    }
  }
  
  // Completar até 6 números se necessário
  while (selectedNumbers.length < 6) {
    const availableNumbers = Array.from({length: 60}, (_, i) => i + 1)
      .filter(num => !selectedNumbers.includes(num))
    
    if (availableNumbers.length === 0) break
    
    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    selectedNumbers.push(availableNumbers[randomIndex])
  }
  
  return selectedNumbers.slice(0, 6).sort((a, b) => a - b)
}

export const formatDate = (dateString) => {
  const [day, month, year] = dateString.split('/')
  return new Date(year, month - 1, day)
}

export const filterDataByDateRange = (data, startDate, endDate) => {
  if (!startDate && !endDate) return data
  
  return data.filter(row => {
    const rowDate = formatDate(row['Data do Sorteio'])
    const start = startDate ? new Date(startDate) : new Date('1996-01-01')
    const end = endDate ? new Date(endDate) : new Date()
    
    return rowDate >= start && rowDate <= end
  })
}

export const getMostLeastFrequent = (frequencies, count = 6) => {
  const sorted = Object.entries(frequencies)
    .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
    .sort((a, b) => b.frequency - a.frequency)
  
  return {
    most: sorted.slice(0, count),
    least: sorted.slice(-count).reverse()
  }
}

