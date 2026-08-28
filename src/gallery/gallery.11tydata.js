export default {
  eleventyComputed: {
    heroImage: (data) => data.cms.gallery.heroImage,
    heroTitle: (data) => data.cms.gallery.heroTitle,
  },
};
