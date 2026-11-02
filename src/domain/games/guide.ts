import { z } from "zod";

const paragraph = z.string().trim().min(1);
export const gameGuideSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.literal("DRAFT"),
  author: paragraph,
  authoredAt: z.iso.datetime({ offset: true }),
  edition: paragraph,
  introduction: paragraph,
  setup: z.array(paragraph).min(1),
  play: z.array(paragraph).min(1),
  victory: z.array(paragraph).min(1),
  recommendedFor: z.array(paragraph).min(1),
  cautions: z.array(paragraph).min(1),
  sources: z.array(z.strictObject({
    name: paragraph,
    url: z.url({ protocol: /^https?$/ }),
    checkedAt: z.iso.datetime({ offset: true }),
    pages: paragraph,
  })).min(1),
});

export type GameGuide = z.infer<typeof gameGuideSchema>;
