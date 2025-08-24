"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import type { ReactNode } from "react"
import { requestCocktailRecommendation, type Cocktail, type BartenderRequest, AlcoholLevel, DifficultyLevel } from "@/api/cocktail"
import { getFromStorage, saveToStorage, clearStorageWithPrefix } from "@/utils/localStorage"
import { generateCocktailImage, generateImagePrompt } from "@/api/image"
import { generateSessionId } from "@/utils/generateId"
import { cocktailLogger } from "@/utils/logger"

// 存储键常量
const STORAGE_KEYS = {
  ANSWERS: "moodshaker-answers",
  FEEDBACK: "moodshaker-feedback",
  BASE_SPIRITS: "moodshaker-base-spirits",
  RECOMMENDATION: "moodshaker-recommendation",
  SESSION_ID: "moodshaker-session-id",
  REQUEST: "moodshaker-request",
  IMAGE_DATA: "moodshaker-image-data",
}

interface SpiritOption {
  id: string
  name: string
  description?: string
}

interface CocktailContextType {
  answers: Record<string, string>
  userFeedback: string
  baseSpirits: string[]
  recommendation: Cocktail | null
  imageData: string | null
  isLoading: boolean
  isImageLoading: boolean
  error: string | null
  progressPercentage: number
  loadSavedData: () => void
  saveAnswer: (questionId: string, optionId: string) => void
  saveFeedback: (feedback: string) => void
  saveBaseSpirits: (spirits: string[]) => void
  toggleBaseSpirit: (spiritId: string, allSpiritsOptions: SpiritOption[]) => void
  submitRequest: () => Promise<Cocktail>
  isQuestionAnswered: (questionId: string) => boolean
  resetAll: () => void
  setIsImageLoading: (loading: boolean) => void
  refreshImage: () => Promise<string | null>
}

const CocktailContext = createContext<CocktailContextType | undefined>(undefined)

interface CocktailProviderProps {
  children: ReactNode
}

export const CocktailProvider = ({ children }: CocktailProviderProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [userFeedback, setUserFeedback] = useState("")
  const [baseSpirits, setBaseSpirits] = useState<string[]>([])
  const [recommendation, setRecommendation] = useState<Cocktail | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isImageLoading, setIsImageLoadingState] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressPercentage, setProgressPercentage] = useState(0)

  const loadSavedData = useCallback(() => {
    const savedAnswers = getFromStorage(STORAGE_KEYS.ANSWERS, {})
    const savedFeedback = getFromStorage(STORAGE_KEYS.FEEDBACK, "")
    const savedBaseSpirits = getFromStorage(STORAGE_KEYS.BASE_SPIRITS, [])
    const savedRecommendation = getFromStorage(STORAGE_KEYS.RECOMMENDATION, null)
    const savedImageData = getFromStorage(STORAGE_KEYS.IMAGE_DATA, null)

    setAnswers(savedAnswers)
    setUserFeedback(savedFeedback)
    setBaseSpirits(savedBaseSpirits)
    setRecommendation(savedRecommendation)
    setImageData(savedImageData)
  }, [])

  const saveAnswer = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prevAnswers: Record<string, string>) => ({
        ...prevAnswers,
        [questionId]: optionId,
      }))
      saveToStorage(STORAGE_KEYS.ANSWERS, {
        ...answers,
        [questionId]: optionId,
      })
    },
    [answers],
  )

  const saveFeedback = useCallback((feedback: string) => {
    setUserFeedback(feedback)
    saveToStorage(STORAGE_KEYS.FEEDBACK, feedback)
  }, [])

  const saveBaseSpirits = useCallback((spirits: string[]) => {
    setBaseSpirits(spirits)
    saveToStorage(STORAGE_KEYS.BASE_SPIRITS, spirits)
  }, [])

  const toggleBaseSpirit = useCallback((spiritId: string, allSpiritsOptions: SpiritOption[]) => {
    setBaseSpirits((prevSpirits: string[]) => {
      const updatedSpirits = prevSpirits.includes(spiritId)
        ? prevSpirits.filter((id: string) => id !== spiritId)
        : [...prevSpirits, spiritId]
      saveToStorage(STORAGE_KEYS.BASE_SPIRITS, updatedSpirits)
      return updatedSpirits
    })
  }, [])

  const submitRequest = useCallback(async (): Promise<Cocktail> => {
    setIsLoading(true)
    setError(null)
    setProgressPercentage(0)

    try {
      const sessionId = generateSessionId()
      saveToStorage(STORAGE_KEYS.SESSION_ID, sessionId)

      const request: BartenderRequest = {
        message: userFeedback || "Please recommend a cocktail based on my preferences",
        alcohol_level: AlcoholLevel.ANY,
        difficulty_level: DifficultyLevel.ANY,
        base_spirits: baseSpirits.length > 0 ? baseSpirits : null,
        session_id: sessionId,
      }

      saveToStorage(STORAGE_KEYS.REQUEST, JSON.stringify(request))

      const recommendation = await requestCocktailRecommendation(request)
      setRecommendation(recommendation)
      saveToStorage(STORAGE_KEYS.RECOMMENDATION, recommendation)

      const prompt = generateImagePrompt(recommendation)
      const imageData = await generateCocktailImage(prompt)
      setImageData(imageData)
      saveToStorage(STORAGE_KEYS.IMAGE_DATA, imageData)

      setProgressPercentage(100)
      return recommendation
    } catch (err) {
      setError("Failed to generate cocktail recommendation.")
      cocktailLogger.error("Error generating cocktail recommendation:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [answers, baseSpirits])

  const isQuestionAnswered = useCallback((questionId: string) => !!answers[questionId], [answers])

  const resetAll = useCallback(() => {
    clearStorageWithPrefix("moodshaker-")
    setAnswers({})
    setUserFeedback("")
    setBaseSpirits([])
    setRecommendation(null)
    setImageData(null)
    setError(null)
    setProgressPercentage(0)
  }, [])

  // 清理损坏的localStorage数据
  const cleanupCorruptedData = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith("moodshaker-"))
      
      keys.forEach(key => {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            // 尝试解析JSON以检查数据是否损坏
            JSON.parse(value)
          }
        } catch (e) {
          console.warn(`Removing corrupted data for key: ${key}`)
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.error("Error during cleanup:", e)
    }
  }, [])

  const setIsImageLoading = useCallback((loading: boolean) => {
    setIsImageLoadingState(loading)
  }, [])

  const refreshImage = useCallback(async () => {
    setIsImageLoading(true)
    setError(null)

    try {
      if (!recommendation) {
        throw new Error("No cocktail recommendation available.")
      }

      const prompt = generateImagePrompt(recommendation)
      const imageData = await generateCocktailImage(prompt)
      setImageData(imageData)
      saveToStorage(STORAGE_KEYS.IMAGE_DATA, imageData)

      return imageData
    } catch (err) {
      setError("Failed to refresh cocktail image.")
      cocktailLogger.error("Error refreshing cocktail image:", err)
    } finally {
      setIsImageLoading(false)
    }

    return null
  }, [recommendation])

  useEffect(() => {
    cleanupCorruptedData()
    loadSavedData()
  }, [loadSavedData, cleanupCorruptedData])

  const contextValue = useMemo(() => {
    return {
      answers,
      userFeedback,
      baseSpirits,
      recommendation,
      imageData,
      isLoading,
      isImageLoading,
      error,
      progressPercentage,
      loadSavedData,
      saveAnswer,
      saveFeedback,
      saveBaseSpirits,
      toggleBaseSpirit,
      submitRequest,
      isQuestionAnswered,
      resetAll,
      setIsImageLoading,
      refreshImage,
    }
  }, [
    answers,
    userFeedback,
    baseSpirits,
    recommendation,
    imageData,
    isLoading,
    isImageLoading,
    error,
    progressPercentage,
    loadSavedData,
    saveAnswer,
    saveFeedback,
    saveBaseSpirits,
    toggleBaseSpirit,
    submitRequest,
    isQuestionAnswered,
    resetAll,
    setIsImageLoading,
    refreshImage,
  ])

  return <CocktailContext.Provider value={contextValue}>{children}</CocktailContext.Provider>
}

export const useCocktailContext = () => {
  const context = useContext(CocktailContext)
  if (!context) {
    throw new Error("useCocktailContext must be used within a CocktailProvider")
  }
  return context
}

export const useCocktail = () => {
  const context = useContext(CocktailContext)
  if (!context) {
    throw new Error("useCocktail must be used within a CocktailProvider")
  }
  return context
}
