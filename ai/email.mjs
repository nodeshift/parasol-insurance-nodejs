import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

export async function createChainAndAskQuestion(model, userResponse) {
  ////////////////////////////////
  // CREATE CHAIN
  const prompt = ChatPromptTemplate.fromTemplate(`
      You are a helpful, respectful and honest assistant named Parasol Assistant.
      You work for Parasol Insurance
      Formatting Instructions: {format_instructions}
      User Input: {input}
  `);

  // Setup the output parser using the Zod Schema
  const outputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      subject: z.string().describe('Subject of your response, suitable to use as an email subject line.'),
      message: z.string().describe('Response text that summarizes the information they gave, and asks for any other missing information needed from Parasol.')
    })
  );

  const chain = prompt.pipe(model).pipe(outputParser);

  return await chain.invoke({
    input: userResponse,
    format_instructions: outputParser.getFormatInstructions()
  });
}
