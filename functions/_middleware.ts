// Redirect apex -> www supaya localStorage & sesi tidak terpecah dua origin.
// File _redirects hanya mendukung path relatif, jadi redirect host dilakukan di sini.
export async function onRequest(context: any) {
  const url = new URL(context.request.url);
  if (url.hostname === 'bundajournal.my.id') {
    url.hostname = 'www.bundajournal.my.id';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
