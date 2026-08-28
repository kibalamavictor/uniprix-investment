export default {
  eleventyComputed: {
    heroImage: (data) => data.cms.contact.heroImage,
    heroTitle: (data) => data.cms.contact.heroTitle,
  },
};
