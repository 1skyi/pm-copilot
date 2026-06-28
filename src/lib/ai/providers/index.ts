import { AIProvider, AIProviderConfig } from "../provider"
import { deepseekProvider } from "./deepseek"

let currentProvider: AIProvider = deepseekProvider
let currentConfig: AIProviderConfig = {
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "",
}

export function getProvider(): AIProvider {
  return currentProvider
}

export function getConfig(): AIProviderConfig {
  return { ...currentConfig }
}

/** For future multi-model support — swap provider at runtime */
export function setProvider(provider: AIProvider, config: AIProviderConfig): void {
  currentProvider = provider
  currentConfig = config
}
