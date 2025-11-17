import nextConfig from "eslint-config-next";

export default [
  {
    ignores: ["node_modules", ".next", "out"],
  },
  ...nextConfig,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];


