import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default [
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "dist/**"],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];
