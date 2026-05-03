/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          strict: true,
          jsx: "react-jsx",
          jsxImportSource: "react",
          esModuleInterop: true,
          module: "commonjs",
          moduleResolution: "node",
        },
      },
    ],
  },
  moduleNameMapper: {
    "\\.(png|jpg|jpeg|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "^expo-camera$": "<rootDir>/__mocks__/expo-camera.js",
    "^react-native$": "<rootDir>/__mocks__/react-native.js",
    "^react-native-maps$": "<rootDir>/__mocks__/react-native-maps.js",
    "^expo-status-bar$": "<rootDir>/__mocks__/expo-status-bar.js",
  },
};
