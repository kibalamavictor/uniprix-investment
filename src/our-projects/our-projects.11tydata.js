export default {
  eleventyComputed: {
    heroImage: (data) => data.cms.projects.heroImage,
    heroTitle: (data) => data.cms.projects.heroTitle,
  },
};
