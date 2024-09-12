import path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';

import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import {HuggingFaceTransformersEmbeddings} from '@langchain/community/embeddings/hf_transformers';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { create } from 'node:domain';

let sessions = {};
let chainWithHistory;

export async function createChain(model) {
  // Parse Docs
  const loader = new PDFLoader(path.join(__dirname, '../', 'resources', 'policies', 'policy-info.pdf'));
  const docs = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20
  });
  const splits = await textSplitter.splitDocuments(docs);

  // Instantiate Embeddings function
  const embeddings = new HuggingFaceTransformersEmbeddings();

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splits,
    embeddings
  );

  const retriever = vectorStore.asRetriever();

  //////////////////////////////
  // CREATE CHAIN

  const prompt = ChatPromptTemplate.fromMessages([
    [ 'system',
      'You are a helpful, respectful and honest assistant named "Parasol Assistant".' +
      'You will be given a claim summary, references to provide you with information, and a question. You must answer the question based as much as possible on this claim with the help of the references.' +
      'Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.' +
      'If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don\'t know the answer to a question, please don\'t share false information.' + 
      'You must answer in 4 sentences or less.' +
      'Don\'t make up policy term limits by yourself' +
      'Context: {context}'
    ],
    new MessagesPlaceholder('history'),
    [ 'human', '{input}' ]
  ]);

  const ragChain = await createStuffDocumentsChain({
    llm: model,
    prompt
  });

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: ragChain,
    retriever
  });

  chainWithHistory = new RunnableWithMessageHistory({
    runnable: retrievalChain,
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

export async function answerQuestion(question, sessionId) {
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

  Claim Inception Date: ${rawQuestion.inceptionDate}

  Claim Summary:

  ${rawQuestion.claim}

  Question: ${rawQuestion.query}
  `
}
