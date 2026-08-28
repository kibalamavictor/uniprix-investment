export default {
  eleventyComputed: {
    heroImage: (data) => data.cms.about.heroImage,
    heroTitle: (data) => data.cms.about.heroTitle,
  },
};
