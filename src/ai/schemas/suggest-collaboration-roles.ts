import {z} from 'genkit';

export const SuggestCollaborationRolesInputSchema = z.object({
  projectType: z
    .string()
    .describe(
      'The type of budget project, e.g., Home Budget, Office Budget, Business Budget.'
    ),
  collaborationScenario: z
    .string()
    .describe(
      'A description of the collaboration scenario, e.g., managing family expenses, sharing office budget with team members, working with a business partner on finances.'
    ),
});
export type SuggestCollaborationRolesInput = z.infer<
  typeof SuggestCollaborationRolesInputSchema
>;

export const SuggestCollaborationRolesOutputSchema = z.object({
  suggestedRoles: z
    .array(z.enum(['Owner', 'Editor', 'Viewer']))
    .describe(
      'An array of suggested roles for the collaborators based on the project type and collaboration scenario.'
    ),
  justification: z
    .string()
    .describe(
      'A brief explanation of why the suggested roles are appropriate for the given scenario.'
    ),
});
export type SuggestCollaborationRolesOutput = z.infer<
  typeof SuggestCollaborationRolesOutputSchema
>;
