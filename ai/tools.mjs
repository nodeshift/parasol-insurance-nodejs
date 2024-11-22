import { tool } from "@langchain/core/tools";
import { z } from "zod";

export function setupTools(fastify) {
  const updateClaimStatusTool = tool(
    async ({ claimId, claimStatus }) => {
      console.log('updating claim status', claimStatus);

      return fastify.sqlite.run('update claim set status = ? where id = ?', [claimStatus, claimId], (err, rows) => {
        console.log(err, rows);
        return `Claim Status updated to ${claimStatus} for claimId ${claimId}`;
        // return reply.send(rows[0]);
      });
    }, {
      name: 'updateClaimStatus',
      schema: z.object({
        claimId: z.string(),
        claimStatus: z.string()
      }),
      description: 'Update the claim status'
    }
  );

  return updateClaimStatusTool
}
