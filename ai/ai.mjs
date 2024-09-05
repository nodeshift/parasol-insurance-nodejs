const { ChatOpenAI } = await import("@langchain/openai");

export function getModel(options = {}) {
  return new ChatOpenAI({
    temperature: options.temperature || process.env.TEMPERATURE || 0.9,
    openAIApiKey: options.openAIApiKey || process.env.OPEN_AI_AP_KEY || 'EMPTY',
    modelName: options.modelName || process.env.AI_MODEL_NAME || 'mistral'
  }, {
    baseURL: options.baseURL || process.env.AI_BASE_URL || 'http://localhost:8000/v1'
  });
}
