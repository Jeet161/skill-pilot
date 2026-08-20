import { generateQuestion } from "../lib/ai/question-generator";

async function main() {
  try {
    console.log("Generating question...");
    const res = await generateQuestion({
      subject: "javascript",
      concept: {
        id: "promises",
        name: "Promises",
        description: "Async/await and promises in JS",
        importance: 0.8,
        prerequisites: [],
        suggestedQuestionTypes: ["MULTIPLE_CHOICE"],
        approxDifficulty: 0.5
      },
      decision: {
        action: "BASELINE",
        targetConceptId: "promises",
        targetDifficulty: 0.5,
        reason: "test",
        needsIntervention: false
      },
      learnerState: {
        sessionId: "123",
        subject: "javascript",
        askedCount: 0,
        targetCount: 10,
        estimates: {},
        recentAccuracy: 0.5,
        overallDifficulty: 0.5
      },
      previousPromptsForConcept: [],
      recentPromptsOverall: []
    });
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Error occurred:");
    console.error(e);
  }
}
main();
