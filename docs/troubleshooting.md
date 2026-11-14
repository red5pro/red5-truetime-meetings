# Troubleshooting

## For people in a meeting

**The browser won't use my camera or microphone.**
Click the camera icon in the address bar and choose **Allow**, then **Try again**. Check that no other app (Zoom,
Teams, another browser tab) is using the camera. On a Mac, also check **System Settings** → **Privacy & Security** →
**Camera** and **Microphone**.

**Others can't hear me.**
Check you're not muted, and that the right microphone is picked in the microphone menu. If push to talk is on,
holding Space unmutes you only while you hold it.

**I can't hear anyone.**
Check the speaker picked in the microphone menu and your computer's volume. Some browsers block sound until you
click somewhere on the page.

**Video freezes or looks blocky.**
Open **More options** → **Diagnostic** to see which connection has trouble. Move closer to your Wi-Fi router or use
a cable, close other tabs, lower **Outgoing Video Quality Limit** in **Video Settings**, or turn off background
effects.

**I joined but see no one else's video.**
Your network may block the connection. Try another network (a phone hotspot is a quick test). If that works, ask
whoever runs your TrueTime Meetings to set up a TURN server.

**A button is greyed out.**
That feature (recording, captions or external streams) is turned off for your organization.

**I'm stuck on "Waiting for approval…".**
A host has to admit you. Let them know you're waiting.

## For people running the app

**The page is blank, or links give a 404.**
The app expects to be served under `/meetings` unless `VITE_BASENAME` says otherwise. Set it to `/` to serve at the
root, and make sure your web server sends `index.html` for unknown paths (the bundled `nginx.conf` does).

**The camera doesn't work on the deployed site but works locally.**
Browsers only allow the camera on `https://` pages (and `localhost`). Serve the app over HTTPS.

**The Docker container exits right away with "VITE_CONFIG_SERVICE_URL is not set".**
Pass `-e VITE_CONFIG_SERVICE_URL=https://...`. It's required. See [Deployment](deployment.md#docker-image).

**Settings changes don't show up.**
The app reads settings when it loads, so reload the page. Check `GET <config service>/api/config` returns what you
expect. In development, values in `.env` win over the config service.

**"There was an error generating the token."**
The config service couldn't sign a token. Check `CONFERENCE_MASTER_KEY` and `CONFERENCE_MASTER_SECRET` are set on
it, and look at its logs.

**"Unable to reach the node group."**
`VITE_NODE_GROUP` doesn't match a node group on your Red5 deployment, or the deployment has no nodes running.

**Recording, captions or external streams fail.**
The feature needs its `VITE_ENABLE_*` flag, the config service with valid master credentials, and support on your
Red5 deployment.

**Noise suppression never finishes loading.**
The model is served from `<basename>/noise-suppression/`. Check that path returns files on your server, or set
`VITE_NOISE_SUPPRESSION_ASSETS_URL`.

**The config service won't start with a database configured.**
It stops rather than falling back to the file if it can't reach MySQL or create its schema. Check the `MEETINGS_DB_*`
values and that the user has rights on the schema (see the
[config service README](../config-service/README.md#database-storage)).

**`npm install` fails fetching truetime-ui.**
It's installed from GitHub, so you need Git and HTTPS access to github.com.

Still stuck? Open an issue with what you tried and what you saw.
