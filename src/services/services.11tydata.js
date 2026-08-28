export default {
  eleventyComputed: {
    heroImage: (data) => data.cms.services.heroImage,
    heroTitle: (data) => data.cms.services.heroTitle,
  },
};
