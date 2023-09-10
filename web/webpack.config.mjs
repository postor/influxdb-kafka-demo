import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack from 'webpack'

export default {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                }
              },
            },
          },
        ],
      },
      {
        test: /\.(m|c)?(t|j)sx?$/,
        exclude: /(node_modules|bower_components).*(?<!shack-get-routes\.js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-typescript',
              '@babel/preset-react',
              '@babel/preset-env',
            ],
            plugins: [
              "@babel/plugin-transform-runtime",
              "@babel/plugin-transform-typescript",
              "styled-jsx/babel",
            ]
          }
        }
      },
      {
        test: /shack-get-routes\.tsx$/,
        use: {
          loader: '@shack-js/auto-routes-loader',
          options: {
            folder: 'src/pages'
          }
        }
      },
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs"]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Minth GPT',
      template: join(dirname(fileURLToPath(import.meta.url)), 'src', 'index.html'),
    }),
    new webpack.ProvidePlugin({
      React: 'react'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ],
  devServer: {
    proxy: {
      '/api': 'http://localhost:3000/api',
    },
    historyApiFallback: true,
  },
  output: {
    path: join(dirname(fileURLToPath(import.meta.url)), 'dist'),
    filename: '[contenthash].js'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
}