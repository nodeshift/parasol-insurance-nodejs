import { getModel } from '../ai/ai.mjs';
import { createChainAndAskQuestion } from '../ai/email.mjs';

async function emailRoute(fastify, options) {
  fastify.post('/api/email', async (request, reply) => {
    console.log(request.body.text);
    // AI Related Setup
    const model = getModel();
    // Create the chain and Ask the question
    console.log('Starting to Ask', new Date());
    const answer = await createChainAndAskQuestion(model, request.body.text);
    console.log('Done Asking', new Date());
    // Return the results
    return {
      subject: answer.subject,
      message: answer.message
    };
  });
}

export default emailRoute;
