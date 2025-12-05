// Health check endpoint for Fly.io and monitoring
export const loader = async () => {
  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
