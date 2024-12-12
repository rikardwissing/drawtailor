import { API_ENDPOINT } from './config/constants.js';
import { mockChallenges, mockGuesses } from './config/mockData.js';
import { svgToWebp } from './utils/svgUtils.js';

export class API {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.useMockData = !apiKey;

    if (this.useMockData) {
      console.warn(
        "No API key provided - using mock data instead, you can add your openai API key as a URL parameter: ?key=your-key-here"
      );
    }
  }

  async getDrawingPrompt() {
    if (this.useMockData) {
      return mockChallenges[Math.floor(Math.random() * mockChallenges.length)];
    }

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a fun drawing game host. Suggest one simple, creative, and fun thing to draw. Keep it to one short sentence. Make it easy enough to draw! Output it like, draw a ....",
          },
          {
            role: "user",
            content: "Give me something fun to draw!",
          },
        ],
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async getGuesses(svg) {
    if (this.useMockData) {
      return mockGuesses[Math.floor(Math.random() * mockGuesses.length)];
    }

    const webpData = await svgToWebp(svg);
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are playing a drawing guessing game. Give 4 different guesses about what the drawing might be. Each answer should just be a word or a phrase. Make each guess fun and enthusiastic! Format output with one guess per line. Only answer with the guesses. Do not add any number or dashes to prefix the guess.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: webpData,
                },
              },
            ],
          },
        ],
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.split("\n");
  }
}