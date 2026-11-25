// Sends www and http requests to the one canonical address (https, no www) with a 301,
// then serves the static site.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.') || url.protocol === 'http:') {
      url.hostname = url.hostname.replace(/^www\./, '');
      url.protocol = 'https:';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
