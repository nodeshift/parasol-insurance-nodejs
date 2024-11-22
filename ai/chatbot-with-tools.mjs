import { setupTools } from "./tools.mjs";
import { HumanMessage } from "@langchain/core/messages";

let llmWithTools;

let toolsByName;

export async function createChain(model, fastify) {
  // Add the tools to the model here
  const updateClaimStatusTool = setupTools(fastify);

  toolsByName = {
    updateClaimStatus: updateClaimStatusTool
  };

  llmWithTools = model.bindTools([updateClaimStatusTool]);
}

export async function answerQuestion(question) {

  const messages = [new HumanMessage(`${question.query} for claim ID ${question.claimId}`)];
  const aiMessage = await llmWithTools.invoke(messages);

  console.log(aiMessage);

  messages.push(aiMessage);

  for (const toolCall of aiMessage.tool_calls) {
    const selectedTool = toolsByName[toolCall.name];
    const toolMessage = await selectedTool.invoke(toolCall);
    messages.push(toolMessage);
  }

  const result = await llmWithTools.invoke(messages);

  console.log(result);

  return result;
}

// // const aiMessage = await llmWithTools.invoke(messages);

// // console.log(aiMessage);

// // messages.push(aiMessage);

// // const toolsByName = {
// //   updateClaimStatus: updateClaimStatusTool
// // };

// for (const toolCall of aiMessage.tool_calls) {
//   const selectedTool = toolsByName[toolCall.name];
//   const toolMessage = await selectedTool.invoke(toolCall);
//   messages.push(toolMessage);
// }

// // console.log(messages);

// // const result = await llmWithTools.invoke(messages);

// // console.log(result);


