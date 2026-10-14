ALFAMART BK0C P263 — Public Viewer + Admin Login

Public visitors can view the site. The upload/processing panel is only shown after server-verified admin login.
Do NOT put admin credentials in index.html.

Vercel setup:
1. Upload the contents of this folder (index.html, api folder, vercel.json) to the root of the GitHub repository.
2. In Vercel: Project > Settings > Environment Variables, add:
   ADMIN_USERNAME = 20121561
   ADMIN_PASSWORD = 070201
   SESSION_SECRET = generate a long random secret (at least 32 random characters)
3. Apply variables to Production (and Preview only if desired), save, then redeploy.
4. Test public view in a private/incognito tab; click Login Admin to access upload panel.

Security note: the example password is short and guessable. Change it to a unique longer password before using this on the public internet. This login protects the admin panel UI/session, but database upload currently runs in the browser and is not stored persistently on the server.
