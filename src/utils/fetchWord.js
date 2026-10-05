import {geminiApiKey} from "../utils/apiKey";

const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

const data = {
  systemInstruction: {
    parts: [
      {
        text: `
        You are an English vocabulary assistant designed for an IELTS learner.

Analyze the supplied English word carefully.

Your task is to provide accurate, learner-friendly information about the word.

Follow these rules:

1. Analyze the exact word provided.
2. Include the important common meanings of the word.
3. For every meaning, provide its part of speech.
4. Provide both:
   - an accurate dictionary-style definition
   - a simpler explanation suitable for an intermediate English learner.
5. Provide natural example sentences that clearly demonstrate the meaning.
6. Provide the common grammatical word forms when they genuinely exist.
7. Do not invent word forms. Use null when a form does not exist or is not a natural form.
8. Provide useful synonyms rather than merely similar-looking words.
9. For every synonym, explain its meaning and register.
10. Provide genuine antonyms when appropriate. If there is no natural antonym, return an empty array.
11. Provide common and useful collocations.
12. For every collocation, provide its meaning and a natural example.
13. Explain the word's register and common contexts.
14. Mention common learner mistakes when relevant. Do not invent mistakes simply to fill the field.
15. Evaluate the word's usefulness for IELTS.
16. Identify IELTS skills for which the word is genuinely useful.
17. Identify relevant IELTS topics.
18. Provide guidance for using the word in IELTS Writing and Speaking.
19. Provide useful synonyms specifically suitable for formal IELTS usage.
20. Provide natural IELTS-style example sentences.
21. Do not exaggerate the IELTS importance of a word.
22. Do not use markdown.
23. Do not include explanations outside the requested JSON structure.
24. Return only information supported by your knowledge. If information is unavailable or genuinely not applicable, use null or an empty array where allowed.

................

Return the answer in JSON format like so,
const vocabularySchema = {
  type: "object",

  properties: {

    word: {
      type: "string",
      description: "The English vocabulary word being analyzed."
    },

    pronunciation: {
      type: "string",
      pronunciation:"pronunciation of the word",
    },

    //dont give more than 3
    meanings: {
      type: "array",

      items: {
        type: "object",

        properties: {

          partOfSpeech: {
            type: "string",
            description: "The grammatical category of this meaning."
          },
          simpleDefinition: {
            type: "string",
            description: "A clear explanation understandable to an intermediate English learner."
          },
          //give at least 1 example and not more than 3
          exampleSentences: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Natural example sentences demonstrating this meaning."
          }
        },
      }
    },

    wordForms: {
      type: "object",

      properties: {
        base: {
          type: "string"
        },
        noun: {
          type: ["string", "null"]
        },
        verb: {
          type: ["string", "null"]
        },
        adjective: {
          type: ["string", "null"]
        },
        adverb: {
          type: ["string", "null"]
        }
      },
    },

    //give at least 2 synonyms and not more than 4
    synonyms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: {
            type: "string"
          },
          meaning: {
            type: "string"
          },
        },
      }
    },
    //give at least 2 anytonyms and not more than 4
    antonyms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: {
            type: "string"
          },
          meaning: {
            type: "string"
          }
        },
      }
    },

    // at least 2 collocations and not more than 4
    collocations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          phrase: {
            type: "string"
          },
          meaning: {
            type: "string"
          },
          example: {
            type: "string"
          }
        },
      }
    },
    ielts: {
      type: "object",
      properties: {
        relevance: {
          type: "string",
          enum: [
            "low",
            "medium",
            "high"
          ]
        },
        topics: {
          type: "array",
          items: {
            type: "string"
          }
        },
        writingUse: {
          type: "string"
        },
        speakingUse: {
          type: "string"
        },
        usefulSynonyms: {
          type: "array",
          items: {
            type: "string"
          }
        },
        ieltsExamples: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
    }
  },
};
        `,
      },
    ],
  },
  contents: [
    {
      parts: [
        {
          text: "The word to analyze is 'ephemeral'",
        },
      ],
    },
  ],
};

export default fetchWord = async () => {
  await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  .then(response=>response.json())
  .then(data=>console.log(data))
  .catch(error=>console.error(error));

  console.log(response);
};
