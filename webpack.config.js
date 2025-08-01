import path from "path";
import webpack from "webpack";

export default {
  mode: "development",
  entry: {
    bundle: "./src/core/lcc.js",
    app: "./src/App.jsx", // New React entry point
    visualizer: "./src/VisualizerApp.jsx",
    resources: "./src/ResourcesApp.jsx"
  },
  output: {
    filename: "[name].js",
    path: path.resolve(process.cwd(), "dist"),
    library: {
      name: "LCC",
      type: "umd",
      export: "default",
    },
  },
  devtool: "source-map",
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000,
  },
  resolve: {
    alias: {
      path: "path-browserify",
      process: path.resolve(process.cwd(), "src/polyfills/processWrapper.js"), 
      fs: path.resolve(process.cwd(), "src/polyfills/fsWrapper.js"), 
    },
    fallback: {
      fs: false,
      stream: false,
      buffer: false,
      url: false,
      util: false,
    },
    extensions: [".js", ".jsx", ".json"], // Add .jsx support
    fullySpecified: false,
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: [path.resolve(process.cwd(), "src/polyfills/processWrapper.js"), "default"], 
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.DefinePlugin({
      global: "{}",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }]
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
};