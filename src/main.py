# from datasets import load_dataset
# from transformers import WhisperProcessor, WhisperForConditionalGeneration
from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
assert OPENAI_API_KEY is not None, "OPENAI_API_KEY is not set"
CLIENT = OpenAI(api_key=OPENAI_API_KEY)

# processor = WhisperProcessor.from_pretrained("openai/whisper-tiny")
# model, _ = WhisperForConditionalGeneration.from_pretrained("openai/whisper-tiny")
# model.config.forced_decoder_ids = None

# ds = load_dataset(
#     "hf-internal-testing/librispeech_asr_dummy", "clean", split="validation"
# )
# sample = ds[0]["audio"]  # type: ignore
# input_features = processor(
#     sample["array"], sampling_rate=sample["sampling_rate"], return_tensors="pt"  # type: ignore
# ).input_features  # type: ignore

# predicted_ids = model.generate(input_features)

# transcription = processor.batch_decode(predicted_ids, skip_special_tokens=False)  # type: ignore

# print(transcription)
def main():
    pass


if __name__ == "__main__":
    main()
