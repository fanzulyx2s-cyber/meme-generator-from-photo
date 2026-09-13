import Link from "next/link";

import { GuideLinks } from "@/components/guide-links";
import { InfoCard, SimplePage } from "@/components/simple-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "How to Make a Pet Meme from a Photo",
  description:
    "Turn a pet photo into a meme by keeping the expression clear, writing one short observation, and editing a clean layout.",
  path: "/guides/make-a-pet-meme-from-a-photo",
});

export default function PetMemeGuidePage() {
  return (
    <SimplePage
      eyebrow="Pet memes"
      title="Your pet already made the face. Give it a point of view."
      description="Pet memes feel personal because the expression does most of the work. A curious stare, a suspicious side-eye, or a very serious nap can become a reaction image once the caption names the familiar moment."
      breadcrumbs={[
        { label: "Guides", href: "/guides" },
        { label: "How to make a pet meme from a photo", href: "/guides/make-a-pet-meme-from-a-photo" },
      ]}
    >
      <InfoCard title="Pick the expression before you write">
        <p>Use a photo of your own pet, or another image you have permission to use. Look for one clear emotion: alert, unimpressed, delighted, patient, or caught in the act. A sharp face and a simple background give the caption a place to land.</p>
      </InfoCard>

      <InfoCard title="Turn the moment into a caption">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Describe the real behavior in a few words: waiting by the bowl, hearing the door, guarding a warm seat.</li>
          <li>Translate it into a human-sized situation people recognize.</li>
          <li>Give the pet a playful point of view without overexplaining it.</li>
          <li>Keep the caption short enough that the expression stays visible.</li>
        </ol>
        <p>A photo of a dog staring at the leash might not need more than “YOU SAID WALK” / “I HEARD A CONTRACT.” The photo supplies the seriousness; the bottom line supplies the twist.</p>
      </InfoCard>

      <InfoCard title="Finish with a light edit">
        <p>Place text away from eyes and ears, use a canvas that fits where you plan to share, and add stickers only when they strengthen the mood. Preview before export: the pet should still be the first thing people notice.</p>
      </InfoCard>

      <GuideLinks
        links={[
          { href: "/guides/write-top-and-bottom-meme-text", title: "Write top and bottom text", description: "Use a readable setup and payoff." },
          { href: "/photo-reaction-meme-maker", title: "Make a reaction meme", description: "Explore a broader reaction-meme workflow." },
        ]}
      />
      <Link href="/#generator" className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800">Make a pet meme</Link>
    </SimplePage>
  );
}
