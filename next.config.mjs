import withPWA from "next-pwa";

const withPwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true
});

export default withPwa({
  reactStrictMode: true
});
