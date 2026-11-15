# Troubleshooting

This page covers problems running or hosting the app. For problems in a meeting (camera, microphone, sound, frozen
video, greyed-out buttons, waiting for approval), see
[Troubleshooting](https://www.red5.net/docs/red5-cloud/users-guide/truetime-meetings/troubleshooting/) in the user guide on the Red5 documentation site.

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
