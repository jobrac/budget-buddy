'use server';
/**
 * @fileOverview AI-powered role suggestion for budget project collaboration.
 *
 * - suggestCollaborationRoles - A function that suggests roles (Owner, Editor, Viewer) for collaborators.
 */

import {ai} from '@/ai/genkit';
import { SuggestCollaborationRolesInputSchema, SuggestCollaborationRolesOutputSchema, type SuggestCollaborationRolesInput, type SuggestCollaborationRolesOutput } from '@/ai/schemas/suggest-collaboration-roles';


export async function suggestCollaborationRoles(
  input: SuggestCollaborationRolesInput
): Promise<SuggestCollaborationRolesOutput> {
  return suggestCollaborationRolesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCollaborationRolesPrompt',
  input: {schema: SuggestCollaborationRolesInputSchema},
  output: {schema: SuggestCollaborationRolesOutputSchema},
  prompt: `You are an expert in access control and role-based permissions for collaborative budget management.

  Based on the project type and collaboration scenario provided, suggest the most appropriate roles (Owner, Editor, Viewer) for the collaborators.
  Also, provide a brief justification for your suggestions.

  Project Type: {{{projectType}}}
  Collaboration Scenario: {{{collaborationScenario}}}

  Format your response as a JSON object with "suggestedRoles" (an array of roles) and "justification" (a string).
  `,
});

const suggestCollaborationRolesFlow = ai.defineFlow(
  {
    name: 'suggestCollaborationRolesFlow',
    inputSchema: SuggestCollaborationRolesInputSchema,
    outputSchema: SuggestCollaborationRolesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
