const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {
      overrideBrowserslist: [
        "Android >= 5",
        "iOS >= 12",
        "Chrome >= 60",
        "Safari >= 12",
        "UCAndroid >= 12",
      ],
    },
  },
};

export default config;
