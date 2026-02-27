import chatbotData from "./chatbot.json";

export function getBotReply(userInput) {
  const input = userInput.toLowerCase();

  for (const intent of chatbotData.intents) {
    for (const keyword of intent.keywords) {
      if (input.includes(keyword)) {
        return intent.response; // ✅ STOP HERE
      }
    }
  }

  return chatbotData.fallback;
}
