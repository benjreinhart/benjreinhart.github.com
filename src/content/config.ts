import { z, defineCollection } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.date(),
    og_image_path: z.ostring(),
  }),
});

export const collections = {
  posts: postsCollection,
};
