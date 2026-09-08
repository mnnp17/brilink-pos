import { useState } from 'react'
import type { DenominationBreakdown, PreviousShiftInfo } from '@/types/shift'

export function useOpenShift(previousShiftInfo: PreviousShiftInfo | null) {
  const [startingCash, setStartingCash] = useState<number>(0)
  const [denominations, setDenominations] = useState<DenominationBreakdown>({})
  const [notes, setNotes] = useState<string>('')
  const [isAutoFilled, setIsAutoFilled] = useState<boolean>(false)
  const [inputHighlight, setInputHighlight] = useState<boolean>(false)

  const handleCopyPrevious = () => {
    if (previousShiftInfo) {
      setStartingCash(previousShiftInfo.closingBalance)
      setIsAutoFilled(true)
      setNotes('Dikonfirmasi sesuai saldo akhir shift sebelumnya')
      
      // Trigger visual feedback (efek kilatan hijau singkat pada input)
      setInputHighlight(true)
      setTimeout(() => setInputHighlight(false), 1000)
    }
  }

  const handleApplyDenominations = (breakdown: DenominationBreakdown) => {
    const calculatedTotal = Object.entries(breakdown).reduce(
      (total, [nominal, count]) => total + Number(nominal) * count,
      0
    )
    
    setStartingCash(calculatedTotal)
    setDenominations(breakdown)
    setIsAutoFilled(false) // Flag manual input via calculator
  }

  return {
    startingCash,
    setStartingCash,
    denominations,
    setDenominations,
    notes,
    setNotes,
    isAutoFilled,
    setIsAutoFilled,
    inputHighlight,
    setInputHighlight,
    handleCopyPrevious,
    handleApplyDenominations
  }
}
