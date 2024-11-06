import path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import {HuggingFaceTransformersEmbeddings} from '@langchain/community/embeddings/hf_transformers';
import { createRetrievalChain } from 'langchain/chains/retrieval';

let sessions = {};
let retrievalChain;

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

  // ////////////////////////////////
  // // Create RAG Chain

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
    [ 'human', '{input}' ]
  ]);

  const ragChain = await createStuffDocumentsChain({
    llm: model,
    prompt
  });

  retrievalChain = await createRetrievalChain({
    combineDocsChain: ragChain,
    retriever
  });
}

export async function answerQuestion(question, sessionId) {
  const result = await retrievalChain.stream({
    input: createQuestion(question)
  });

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
