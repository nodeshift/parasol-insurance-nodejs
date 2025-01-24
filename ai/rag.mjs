import path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import {HuggingFaceTransformersEmbeddings} from '@langchain/community/embeddings/hf_transformers';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';

export default async function createRagRetrieverChain(model, prompt) {
  // Parse Docs
  const loader = new PDFLoader(path.join(__dirname, '../', 'resources', 'policies', 'policy-info.pdf'));
  const docs = await loader.load();

  // Split them
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

  const ragChain = await createStuffDocumentsChain({
    llm: model,
    prompt
  });

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: ragChain,
    retriever
  });

  return retrievalChain;
}