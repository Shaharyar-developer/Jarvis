export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkSpeech = async () => {
  const req = await fetch("http://127.0.0.1:3000");
  const res = (await req.json()) as boolean;
  console.log(res);

  return res;
};