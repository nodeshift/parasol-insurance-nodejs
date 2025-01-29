import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';

let sessions = {};
let chainWithHistory;

export function createChain(model) {
  ////////////////////////////////
  // CREATE CHAIN
  const prompt = ChatPromptTemplate.fromMessages([
    [ 'system',
      'You are a helpful, respectful and honest assistant named "Parasol Assistant".' +
      'You will be given a claim summary, references to provide you with information, and a question. You must answer the question based as much as possible on this claim with the help of the references.' +
      'Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.' +
      'If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don\'t know the answer to a question, please don\'t share false information.' + 
      'Don\'t make up policy term limits by yourself'
    ],
    new MessagesPlaceholder('history'),
    [ 'human', '{input}' ]
  ]);

  const chain = prompt.pipe(model);

  chainWithHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: (sessionId) => {
      if (sessions[sessionId] === undefined) {
        sessions[sessionId] = new ChatMessageHistory();
      }
      return sessions[sessionId];
    },
    inputMessagesKey: 'input',
    historyMessagesKey: 'history',
  });

}

export async function chat(question, sessionId) {
  const result = await chainWithHistory.stream(
    { input: createQuestion(question) },
    { configurable: { sessionId: sessionId } }
  );

  return result;
}

export function resetSessions(sessionId) {
  delete sessions[sessionId];
}

function createQuestion(rawQuestion) {
  return `Claim ID: ${rawQuestion.claimId}

  Policy Inception Date: ${rawQuestion.inceptionDate}

  Claim Summary:

  ${rawQuestion.claim}

  Question: ${rawQuestion.query}
  `
}
