export type CaptchaChallenge = {
  question: string;
  answer: string;
};

export function createCaptchaChallenge(): CaptchaChallenge {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 1;
  return {
    question: `${a} + ${b}`,
    answer: String(a + b),
  };
}

export function isCaptchaAnswerValid(challenge: CaptchaChallenge, value: string): boolean {
  return value.trim() === challenge.answer;
}
