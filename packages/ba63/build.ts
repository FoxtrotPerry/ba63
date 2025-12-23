await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  naming: "[dir]/[name].js",
  sourcemap: "external",
  external: ["node-hid"],
  // minify: {
  //   whitespace: true,
  //   syntax: true,
  //   identifiers: true,
  //   keepNames: false,
  // },
});

export {}; // to treat this file as a module
