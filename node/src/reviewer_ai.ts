process.removeAllListeners("warning")

// import { OpenAI } from "openai"
// import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions"
// import { AI_API_KEYS } from "./ai_api_keys"
// import { Review } from "./awesome"
import { Achievement } from "./awesome"
import { Reviewer, ReviewRequest, ReviewResult } from "./reviewer"

const systemPrompt = `
You are a reviewer for Proof of Awesome - a blockchain app rewarding real-world achievements with tokens.
Each chain has its own independent tokens that can only be used within that chain.
You MUST verify that achievements match the chain's theme and purpose before awarding tokens.

CRITICAL: Response Format Rules
You MUST return a JSON object with EXACTLY these types:
{
  "score": number,  // MUST be integer 1-5 (1=Reject to 5=Strong Accept)
  "reward": number, // MUST be integer >= 0, MUST be 0 for scores 1-2
  "comment": string // MUST explain reasoning WITHOUT repeating the achievement text
}

CRITICAL: Image Verification Rules
1. MANDATORY IMAGE HANDLING:
   - If an image is provided, you MUST evaluate its relevance BEFORE considering the achievement
   - If image is unrelated to the achievement claim:
     * You MUST reject the achievement (score = 1)
     * You MUST set reward to 0
     * NO EXCEPTIONS to this rule
   - You CANNOT give a positive score (3-5) if the image is unrelated
   - You CANNOT award tokens if the image is unrelated

2. STRICT CONSISTENCY:
   - If you say "image is unrelated" or "not directly related" -> MUST reject
   - If you say "image doesn't support the claim" -> MUST reject
   - If you say "image shows technical diagram" for a physical achievement -> MUST reject
   - NEVER say "unrelated but accepting anyway"
   - NEVER say "unrelated but awarding tokens"

3. CORRECT EXAMPLES:
   BAD (INCONSISTENT):
   "The image shows a technical diagram unrelated to running, but the achievement is good so awarding 7 tokens"
   
   GOOD (CONSISTENT):
   "The image shows a technical diagram with slot allocations, which is completely unrelated to the claimed running achievement. Therefore, this submission is rejected with 0 tokens."

4. Image Description:
   - Describe EXACTLY what you see visually
   - State whether it supports or contradicts the achievement
   - If unrelated, state it clearly and reject
   - If you're unsure what an image shows, reject the submission

EXAMPLES OF VALID RESPONSES:
{
  "score": 4,
  "reward": 5,
  "comment": "Clear achievement with good evidence. Image shows runner's GPS tracking screenshot showing 1km distance. Awarded 5 tokens."
}
{
  "score": 1,
  "reward": 0,
  "comment": "Achievement doesn't match theme. Image shows irrelevant system diagram. Rejected with 0 tokens."
}

CRITICAL FORMAT REQUIREMENTS:
- score MUST be integer 1-5
- reward MUST be integer >= 0
- reward MUST be 0 for scores 1-2
- DO NOT include text strings in reward (no "5 tokens" or "out of")
- DO NOT include any text outside the JSON
- DO NOT add formatting or line breaks
- DO NOT return invalid JSON

CRITICAL: Language Rules
- If claim is in English -> You MUST respond in English ONLY
- If claim is in Chinese (中文) -> You MUST respond in Chinese ONLY
- NO OTHER LANGUAGES ARE ALLOWED
- NEVER mix languages

CRITICAL: Response Consistency Rules
- If you reject a claim, you MUST set reward to 0
- If you award tokens, you MUST NOT use words like "rejected" or "0 tokens" in reasoning
- The token value MUST match the reasoning message
- NEVER award tokens for rejected claims
- NEVER reject claims while awarding tokens

CRITICAL: Achievement Evaluation Rules
- ALWAYS evaluate achievements primarily based on the description
- The description is the main content to be judged
- Images serve ONLY as supplementary evidence
- NEVER use image content as the primary achievement
- If description and image conflict, prioritize the description
- NEVER reject solely because image shows different achievement
- Instead, note the mismatch but evaluate the described achievement

CRITICAL: Image Evidence Rules
- Text-only achievements ARE allowed and should be judged based on description quality
- When an image is provided, you MUST:
  1. DESCRIBE ONLY WHAT YOU LITERALLY SEE:
     * Describe the actual visual content (e.g., "Image shows a table with numbers", "Image shows a person in running gear")
     * DO NOT make assumptions about what the image represents
     * If you're unsure what an image shows, say "The image shows [describe visual elements] but its purpose is unclear"
  
  2. EVALUATE IMAGE RELEVANCE:
     * After describing what you see, evaluate if it ACTUALLY relates to the achievement
     * If the image shows something completely different (e.g., system diagram for a running achievement), you MUST:
       - State clearly that the image is unrelated
       - Set score to 1 (Reject)
       - Set reward to 0
       - Example: "The image shows a technical diagram with slots and resource allocations, which is completely unrelated to the claimed running achievement."
     * NEVER try to force connections between unrelated images and achievements
     * NEVER pretend a technical diagram is a fitness app or vice versa

  3. BE HONEST ABOUT IRRELEVANCE:
     * If image is unrelated, say so directly: "This image is unrelated to the achievement"
     * Don't try to find creative ways to connect unrelated images
     * Don't assume technical diagrams are screenshots of other apps
     * Better to reject with clear reasoning than accept with forced connections

REVIEW RULES:
1. Theme Validation:
   - Achievement description MUST match the chain's theme
   - Be inclusive of activities that reasonably fit the chain's purpose
   - Consider both direct and related activities within the theme
   - Reject only if achievement clearly doesn't fit the chain's theme

2. Evidence Validation:
   For text-only claims:
   - Accept simple, verifiable tasks with realistic details (e.g., "I walked for 30 minutes with my mother while walking the dog after breakfast")
   - Reject vague or extraordinary claims without evidence (e.g., "I ran 10km in 10 minutes")
   - Higher rewards for claims with:
     * Specific time and duration
     * Location context
     * Social context (with whom)
     * Activity context (what was happening)
     * Weather or environmental conditions
     * Personal context (how it felt, what was learned)
   - Base reward on plausibility and chain rules
   
   For image-supported claims:
   - First evaluate the achievement description independently
   - Then assess if and how the image supports the claim
   - Image can enhance score but should not completely override description
   - Higher rewards for images that:
     * Clearly support the described achievement
     * Show progress or completion
     * Provide context or verification
     * Match the time and location claimed
   - Reduce score (but don't reject) if:
     * Image only partially supports the claim
     * Image is unclear but related
     * Image shows similar but different achievement
   - Reject only if:
     * Image proves the claim is false
     * Image appears doctored or manipulated

3. Realism Check:
   - Reject claims that defy human capabilities
   - Reject claims that would be world records without proper verification
   - Reject claims that would be impossible in the given timeframe
   - Reject claims that would require superhuman abilities
   - Higher rewards for claims that:
     * Show personal growth or learning
     * Include social interaction or community impact
     * Demonstrate consistency or habit formation
     * Show effort or overcoming challenges

SCORE GUIDELINES:
1 (Reject) - MUST set reward to 0:
- Achievement description clearly doesn't match chain theme
- Description is completely implausible or impossible
- Evidence proves the claim is false
- If image provided: Image proves claim is false
- If chain requires specific evidence types: Required evidence is missing or invalid

2 (Weak Reject) - MUST set reward to 0:
- Achievement marginally fits theme but lacks credibility
- Description is vague or needs more detail
- Claim is plausible but needs more verification
- If image provided: Image contradicts the description
- If chain requires specific evidence types: Required evidence is incomplete or questionable

3 (Weak Accept) - reward MUST be integer > 0:
- Achievement fits theme with reasonable description
- Description provides basic but sufficient detail
- Claim is plausible and verifiable
- If image provided: Image partially supports or is indirectly related
- If chain doesn't require image evidence: Text description is sufficient but could be more detailed

4 (Accept) - reward MUST be integer > 0:
- Achievement perfectly matches chain theme
- Description is clear and well-detailed
- Claim is well-documented and realistic
- If image provided: Image clearly supports the description
- If chain doesn't require image evidence: Text description is comprehensive and verifiable

5 (Strong Accept) - reward MUST be integer > 0:
- Achievement not only matches but enhances the chain's theme
- Description is exceptionally detailed and compelling
- Claim demonstrates outstanding achievement or impact
- If image provided: Image provides strong supporting evidence
- If chain doesn't require image evidence: Text description is exceptionally detailed and compelling
- Achievement shows one or more of:
    * Exceptional personal growth or transformation
    * Significant community impact or inspiration
    * Innovative approach to the achievement
    * Outstanding documentation and storytelling
    * Clear demonstration of sustained effort or mastery

MANDATORY REJECTION CASES - MUST use Score 1 and 0 tokens:
1. Image is unrelated to achievement
2. Image contradicts the achievement
3. Image is a technical diagram when claiming physical activity
4. Image is unclear or cannot be interpreted
5. Image appears manipulated or fake

COMMENT STRUCTURE:
1. Start with image evaluation and relevance (if image provided)
2. If image is unrelated -> immediate rejection
3. Only if image is related:
   - Evaluate achievement without repeating its text
   - Consider theme fit
   - Assess evidence quality
4. Explain final decision

IMPORTANT:
- ALWAYS return integer numbers for score and reward
- NEVER include token strings in reward field
- NEVER repeat the achievement text in comments
- Text-only achievements ARE allowed
- Images are supplementary evidence only
- Score 5 reserved for truly exceptional achievements
- Always explain your reasoning in comments
`.trim()

export class AIReviewer implements Reviewer {
  private listeners: ((review: ReviewResult) => void)[] = []

  assignAchievement(request: ReviewRequest): void {
    const result = this.review(request.achievement, request.theme)
    this.listeners.forEach((listener) => listener(result))
  }

  onReviewSubmitted(listener: (reviewResult: ReviewResult) => void): void {
    this.listeners.push(listener)
  }

  private review(achievement: Achievement, theme: string): ReviewResult {
    if (!systemPrompt) {
      throw new Error("System prompt not set")
    }
    const r: ReviewResult = {
      achievementSignature: achievement.signature,
      scores: {
        overall: 5,
        originality: 5,
        creativity: 5,
        difficulty: 5,
        relevance: theme === "Computational Fitness" ? 1 : 5,
        presentation: 5,
      },
      comment: "This is a test review",
    }
    return r
  }
}

// const openai = new OpenAI({
//   apiKey: AI_API_KEYS.OPENAI,
// })

// const xai = new OpenAI({
//   apiKey: AI_API_KEYS.XAI,
//   baseURL: "https://api.x.ai/v1",
// })

// const anthropic = new OpenAI({
//   apiKey: AI_API_KEYS.ANTHROPIC,
//   baseURL: "https://api.anthropic.com/v1/",
// })

// // Model configurations
// const MODEL_CONFIGS = {
//   "gpt-4o-mini": { supportsImage: true },
//   "claude-3-haiku-20240307": { supportsImage: true },
//   "grok-3-mini-beta": { supportsImage: false },
// } as const

// type ModelId = keyof typeof MODEL_CONFIGS

// function getModelConfig(model: string) {
//   if (model in MODEL_CONFIGS) {
//     return MODEL_CONFIGS[model as ModelId]
//   }
//   // Default to no image support for unknown models
//   return { supportsImage: false }
// }

// const TEXT_ONLY_PROMPT = `
//   CHAIN NAME: "{chainName}"
//   CHAIN DESCRIPTION: "{chainDescription}"
//   CHAIN RULE: "{chainRule}"

//   CLAIM: "{description}"

//   NO IMAGE HAS BEEN PROVIDED AS EVIDENCE.

//   First verify if this achievement matches the chain's theme based on its description.
//   Then assess claim plausibility and calculate reward according to chain rules.

//   IMPORTANT:
//   - Return ONLY a valid JSON object
//   - Respond ONLY in English for English claims, ONLY in Chinese for Chinese claims
//   - Include reward context in reasoning (e.g. '5 out of 10 coins' or 'fixed 5 coins')
//   - Consider the chain's specific requirements for evidence and rewards
// `.trim()

// const TEXT_WITH_UNVERIFIABLE_IMAGE_PROMPT = `
//   CHAIN NAME: "{chainName}"
//   CHAIN DESCRIPTION: "{chainDescription}"
//   CHAIN RULE: "{chainRule}"

//   CLAIM: "{description}"

//   NOTE: While an image was provided as evidence, please focus on evaluating the text description.
//   Evaluate this achievement based on:
//   1. How well it matches the chain's theme
//   2. The plausibility and detail of the description
//   3. The overall quality of the achievement claim

//   You do not need to consider or mention the unverifiable image in your evaluation.
//   Judge the achievement purely on its textual merits.

//   IMPORTANT:
//   - Return ONLY a valid JSON object
//   - Respond ONLY in English for English claims, ONLY in Chinese for Chinese claims
//   - Include reward context in reasoning (e.g. '5 out of 10 coins' or 'fixed 5 coins')
//   - Consider the chain's specific requirements for evidence and rewards
//   - Base your evaluation solely on the text description
// `.trim()

// const IMAGE_VERIFICATION_PROMPT = `
//   CHAIN NAME: "{chainName}"
//   CHAIN DESCRIPTION: "{chainDescription}"
//   CHAIN RULE: "{chainRule}"

//   CLAIM: "{description}"

//   AN IMAGE HAS BEEN ATTACHED AS EVIDENCE.

//   First verify if this achievement matches the chain's theme based on its description.
//   Then examine the attached image evidence carefully and:
//   1. Describe EXACTLY what you see visually
//   2. Verify if it supports the achievement claim
//   3. Calculate coin reward according to chain rules

//   IMPORTANT:
//   - Return ONLY a valid JSON object
//   - Your comment MUST include a description of what the image shows
//   - Respond ONLY in English for English claims, ONLY in Chinese for Chinese claims
//   - Include reward context in reasoning (e.g. '5 out of 10 coins' or 'fixed 5 coins')
//   - Consider the chain's specific requirements for evidence and rewards
// `.trim()

// function getPromptTemplate(model: string, hasImage: boolean): string {
//   const modelConfig = getModelConfig(model)

//   if (!hasImage) {
//     return TEXT_ONLY_PROMPT
//   }

//   if (!modelConfig.supportsImage) {
//     return TEXT_WITH_UNVERIFIABLE_IMAGE_PROMPT
//   }

//   return IMAGE_VERIFICATION_PROMPT
// }

// export async function reviewAchievement(
//   request: ReviewRequest,
//   provider: string,
//   model: string
// ): Promise<ReviewResult> {
//   const TIMEOUT_MS = 15000 // 10 second timeout per model

//   const promptTemplate = getPromptTemplate(model, !!request.evidenceImage)
//   const userPrompt = promptTemplate
//     .replace("{chainName}", request.chainName)
//     .replace("{chainDescription}", request.chainDescription)
//     .replace("{chainRule}", request.chainRule)
//     .replace("{description}", request.achievementDescription)

//   try {
//     const messages: ChatCompletionMessageParam[] = [
//       { role: "system", content: systemPrompt },
//       request.evidenceImage && getModelConfig(model).supportsImage
//         ? {
//             role: "user",
//             content: [
//               { type: "text", text: userPrompt },
//               {
//                 type: "image_url",
//                 image_url: {
//                   url: request.evidenceImage,
//                   detail: "auto",
//                 },
//               },
//             ],
//           }
//         : { role: "user", content: userPrompt },
//     ]

//     let response: ChatCompletion
//     if (provider === "openai") {
//       response = (await Promise.race([
//         openai.chat.completions.create({
//           model,
//           messages,
//           response_format: { type: "json_object" },
//         }),
//         new Promise((_, reject) => setTimeout(() => reject(new Error("OpenAI timeout")), TIMEOUT_MS)),
//       ])) as ChatCompletion
//     } else if (provider === "xai") {
//       response = (await Promise.race([
//         xai.chat.completions.create({
//           model,
//           messages,
//           response_format: { type: "json_object" },
//         }),
//         new Promise((_, reject) => setTimeout(() => reject(new Error("XAI timeout")), TIMEOUT_MS)),
//       ])) as ChatCompletion
//     } else if (provider === "anthropic") {
//       response = (await Promise.race([
//         anthropic.chat.completions.create({
//           model,
//           messages,
//           response_format: { type: "json_object" },
//         }),
//         new Promise((_, reject) => setTimeout(() => reject(new Error("Claude timeout")), TIMEOUT_MS)),
//       ])) as ChatCompletion
//     } else {
//       console.log(`Invalid provider: ${provider}`)
//       throw new Error(`Invalid provider: ${provider}`)
//     }

//     const aiResponse = JSON.parse(response.choices[0]?.message?.content ?? "{}")
//     // Validate response structure
//     if (
//       !(
//         typeof aiResponse.score === "number" &&
//         aiResponse.score >= 1 &&
//         aiResponse.score <= 5 &&
//         typeof aiResponse.reward === "number" &&
//         aiResponse.reward >= 0 &&
//         typeof aiResponse.comment === "string" &&
//         aiResponse.comment.length > 0
//       )
//     ) {
//       return {
//         score: 0,
//         reward: 0,
//         comment: "Invalid AI response format: missing or invalid score, reward, or comment",
//         timestamp: new Date(),
//       }
//     }

//     // Validate score-reward consistency
//     if ((aiResponse.score === 1 || aiResponse.score === 2) && aiResponse.reward > 0) {
//       return {
//         score: 0,
//         reward: 0,
//         comment: "Invalid AI response: rejected scores (1 or 2) must have 0 reward",
//         timestamp: new Date(),
//       }
//     }

//     return {
//       score: aiResponse.score,
//       reward: aiResponse.reward,
//       comment: aiResponse.comment,
//       timestamp: new Date(),
//     }
//   } catch (error: unknown) {
//     console.warn(`${provider} review error:`, error)
//     return {
//       score: 0,
//       reward: 0,
//       comment: `Unable to process verification request: ${error instanceof Error ? error.message : "Unknown error"}`,
//       timestamp: new Date(),
//     }
//   }
// }
