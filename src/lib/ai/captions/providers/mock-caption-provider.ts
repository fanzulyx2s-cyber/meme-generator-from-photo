import type { CaptionProvider } from "../caption-provider";
import { parseGenerateCaptionsRequest, parseGenerateCaptionsResult } from "../schema";
import type {
  CaptionStyle,
  GenerateCaptionsInput,
  GenerateCaptionsResult,
  MemeCaption,
} from "../types";

const captionsByStyle: Record<CaptionStyle, MemeCaption[]> = {
  funny: [
    { topText: "WHEN THE CAMERA OPENS", bottomText: "AND THE CHAOS STARTS" },
    { topText: "ME TRYING TO LOOK NORMAL", bottomText: "THE PHOTO SAYS OTHERWISE" },
    { topText: "ONE QUICK PICTURE", bottomText: "SUDDENLY A WHOLE STORY" },
    { topText: "I HAD A PLAN", bottomText: "THE MOMENT HAD ANOTHER" },
    { topText: "SMILE FOR THE PHOTO", bottomText: "THE PHOTO CAUGHT EVERYTHING" },
  ],
  sarcastic: [
    { topText: "YES THIS IS FINE", bottomText: "NO FURTHER QUESTIONS" },
    { topText: "TOTALLY UNDER CONTROL", bottomText: "AS YOU CAN SEE" },
    { topText: "MY BEST DECISION TODAY", bottomText: "APPARENTLY" },
    { topText: "JUST ACT NATURAL", bottomText: "THAT WENT GREAT" },
    { topText: "NOTHING TO SEE HERE", bottomText: "EXCEPT THE EVIDENCE" },
  ],
  wholesome: [
    { topText: "A LITTLE JOY", bottomText: "GOES A LONG WAY" },
    { topText: "GOOD MOMENT DETECTED", bottomText: "SAVING THIS ONE" },
    { topText: "SMALL SMILE", bottomText: "BIG DAY" },
    { topText: "THE KIND OF MOMENT", bottomText: "YOU WANT TO KEEP" },
    { topText: "JUST BEING HERE", bottomText: "IS PRETTY NICE" },
  ],
  reaction: [
    { topText: "ME READING THAT MESSAGE", bottomText: "ONE MORE TIME" },
    { topText: "WHEN THE PLAN CHANGES", bottomText: "AGAIN" },
    { topText: "I HEARD THE NEWS", bottomText: "I AM PROCESSING" },
    { topText: "THAT WAS NOT", bottomText: "ON MY BINGO CARD" },
    { topText: "MY FACE WHEN", bottomText: "THE GROUP CHAT STARTS" },
  ],
  workplace: [
    { topText: "WHEN THE MEETING", bottomText: "COULD HAVE BEEN EMAIL" },
    { topText: "NEW DEADLINE", bottomText: "SAME CALENDAR" },
    { topText: "ME NODDING", bottomText: "LIKE I UNDERSTAND" },
    { topText: "QUICK SYNC", bottomText: "FORTY FIVE MINUTES LATER" },
    { topText: "THE SPREADSHEET", bottomText: "HAS FEELINGS NOW" },
  ],
};

/** Development and test provider. It never sends, logs, or inspects image data. */
export class MockCaptionProvider implements CaptionProvider {
  readonly name = "mock" as const;

  async generateCaptions(input: GenerateCaptionsInput): Promise<GenerateCaptionsResult> {
    const request = parseGenerateCaptionsRequest(input);
    const captions = captionsByStyle[request.style].map((caption) => ({ ...caption }));

    return parseGenerateCaptionsResult({ captions });
  }
}
