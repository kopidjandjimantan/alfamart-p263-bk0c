ALFAMART BK0C P263 — Public Viewer + Admin Login

Public visitors can view the site. The upload/processing panel is only shown after server-verified admin login.
Do NOT put admin credentials in index.html.

Vercel setup:
1. Upload the contents of this folder (index.html, api folder, vercel.json) to the root of the GitHub repository.
2. In Vercel: Project > Settings > Environment Variables, add:
   ADMIN_USERNAME = (username admin utama pilihan Anda)
   ADMIN_PASSWORD = (password admin utama yang kuat)
   SESSION_SECRET = generate a long random secret (at least 32 random characters)
3. Apply variables to Production (and Preview only if desired), save, then redeploy.
4. Test public view in a private/incognito tab; click Login Admin to access upload panel.

Security note: the example password is short and guessable. The requested extra account 20121561 / 13 is stored locally in each browser and is not suitable for public-internet security. Configure server-side credentials with a strong password before public deployment. This login protects the admin panel UI/session, but database upload currently runs in the browser and is not stored persistently on the server.
