// import { Configuration, OpenAIApi } from "openai";

// const configuration = new Configuration({
// 	organization: "org-oDtDeqiXBOuyvDSjIV0FJUFt",
// 	apiKey: "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",
// });
// const openai = new OpenAIApi(configuration);
// const response = await openai.listEngines();

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: "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",
});

export async function mainTest() {
    console.log("Contacting ChatGPT.");
    const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say this is a test' }],
    });
  
    console.log(completion.choices);
}