import { pipeline, SummarizationPipeline } from "@xenova/transformers";
import { performance } from "perf_hooks";

class LocalModels {
  private summarizer: SummarizationPipeline | undefined;

  constructor() {}

  async init() {
    this.summarizer = await pipeline(
      "summarization",
      "Xenova/distilbart-cnn-6-6",
      {
        quantized: true,
        progress_callback: (progress: unknown) => {
          console.log(progress);
        },
      },
    );
  }

  async summarize(text: string) {
    if (!this.summarizer) {
      throw new Error(
        "Summarizer not initialized. Call init() before summarize().",
      );
    }

    const start = performance.now();
    const data = await this.summarizer(text, { do_sample: false });
    const end = performance.now();

    console.log(`Time taken: ${(end - start) / 1000} seconds`);
    return data;
  }
}

export { LocalModels };
