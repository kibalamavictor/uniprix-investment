export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("dist");
  eleventyConfig.addPassthroughCopy("data/cms");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("_data");
  eleventyConfig.addPassthroughCopy("media");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("about-us/assets");
  eleventyConfig.addPassthroughCopy("contact-us/assets");
  eleventyConfig.addPassthroughCopy("gallery/assets");
  eleventyConfig.addPassthroughCopy("our-projects/assets");
  eleventyConfig.addPassthroughCopy("services/assets");
  eleventyConfig.addPassthroughCopy({ "*.png": "." });
  eleventyConfig.addPassthroughCopy({ "*.webp": "." });
  eleventyConfig.addPassthroughCopy({ "*.svg": "." });

  return {
    dir: {
      input: "src",
      includes: "../_includes",
      data: "../_data",
      output: "_site",
    },
    pathPrefix: "/",
  };
}
