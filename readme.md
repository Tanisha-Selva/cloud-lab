# Cloud Computing Lab --- Tomorrow's Step-by-Step Guide

Follow these steps **in order on the lab computer**. You do not need to
memorise them. Keep this file open and do one step at a time.

## Important: `.env` and Git

Do **not** upload your actual `.env` file to Git, even if it currently
contains placeholders. Tomorrow you will put real credentials in it, and
those must stay private.

-   Commit `.env.example` with placeholder values.
-   Keep `.env` in `.gitignore`.
-   Create a local `.env` on the lab computer by copying `.env.example`.
-   Never commit `serviceAccountKey.json`, passwords, connection
    strings, client secrets, or access tokens.

If `.env` has already been pushed, remove it from Git tracking and keep
it ignored. If a real credential was ever pushed, revoke/rotate it;
deleting the file in a later commit does not erase it from Git history.

------------------------------------------------------------------------

# Part 1 --- Clone and prepare the project

## Step 1: Open Command Prompt or VS Code terminal

On the lab computer, open **Command Prompt** or a terminal in VS Code.

Move to a folder where you want the project saved:

``` bash
cd %USERPROFILE%\Desktop
```

## Step 2: Clone your repository

Copy the HTTPS clone URL from your Git repository website. Replace the
example URL below with your actual URL:

``` bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```

Enter the folder Git created. Replace the example folder name with the
real one:

``` bash
cd YOUR-REPOSITORY
```

You must be in the folder containing `package.json` before running npm
commands.

If `git` is not recognised, Git may not be installed or available in
PATH. Use an approved lab installation or ask the instructor.

## Step 3: Check Node.js and npm

Run:

``` bash
node -v
npm -v
```

Both should print version numbers. If either is not recognised,
Node.js/npm is not available in that terminal.

## Step 4: Install packages

Run this from the project root:

``` bash
npm install
```

Wait until it finishes. Do not copy `node_modules` from your own
computer. `npm install` recreates it using the package files.

If it fails, read the first error and check internet access and Node.js
before changing code.

------------------------------------------------------------------------

# Part 2 --- Create `.env` on the lab computer

## Step 5: Create the file

In the project root---the same folder as `server.js`---create a new file
named exactly:

``` text
.env
```

In VS Code: **New File → `.env`**.

If using Notepad, choose **Save as type: All files** and name it `.env`,
not `.env.txt`.

If the repository contains `.env.example`, copy its contents into
`.env`. Otherwise, paste this template:

``` env
PORT=3000

USE_MONGODB=false
MONGODB_URI=
DB_NAME=cloud_lab

USE_FIREBASE=false

USE_AUTH0=false
AUTH0_SECRET=replace_with_a_long_random_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

USE_DROPBOX=false
DROPBOX_ACCESS_TOKEN=
```

Keep variable names exactly as written. Do not add spaces around `=`. Do
not paste explanatory placeholder text as if it were a real credential.

**Leave all cloud flags as `false` until you have configured the service
you need.** The local REST API can run without cloud credentials.

------------------------------------------------------------------------

# Part 3 --- Start the project locally first

## Step 6: Start the backend

From the project root, run:

``` bash
node server.js
```

Leave this terminal open.

You should see something similar to:

``` text
Server running at http://localhost:3000
Storage: In-memory
Firebase: Disabled
Auth0: Disabled
Dropbox: Disabled
```

Your exact output depends on your `.env` settings.

## Step 7: Test the backend

Open these URLs in your browser:

-   `http://localhost:3000/` --- shows the service status.
-   `http://localhost:3000/api/records` --- shows the REST records.

The initial in-memory record should resemble:

``` json
[
  {
    "_id": "1",
    "name": "Sample Record",
    "category": "General"
  }
]
```

If these URLs work, the backend is running.

## Step 8: Start the frontend in a second terminal

Open a **second** terminal in the same project folder. Do not stop the
backend terminal.

Run:

``` bash
npx http-server frontend -p 8080
```

If asked to install `http-server`, proceed only if permitted by lab
rules and internet access is available.

Open:

``` text
http://localhost:8080
```

If the frontend cannot reach the backend, make sure the backend is
running on port 3000 and the frontend API base URL points to
`http://localhost:3000`.

------------------------------------------------------------------------

# Part 4 --- RESTful API

REST CRUD is the local baseline and does not require a cloud account.

  Operation          Method   URL
  ------------------ -------- ---------------------------------------
  Read all records   GET      `http://localhost:3000/api/records`
  Create record      POST     `http://localhost:3000/api/records`
  Update record      PUT      `http://localhost:3000/api/records/1`
  Delete record      DELETE   `http://localhost:3000/api/records/1`

For POST, send JSON with header `Content-Type: application/json`.
Example body:

``` json
{
  "name": "Notebook",
  "category": "Stationery"
}
```

The create route requires both `name` and `category`. For update, you
can send one or both fields.

You can test POST, PUT, and DELETE through the frontend, Postman,
Thunder Client, or another API client.

**Remember:** in-memory changes disappear when you restart the backend.
Use MongoDB Atlas when the scenario requires persistent cloud storage.

------------------------------------------------------------------------

# Part 5 --- MongoDB Atlas

Use this when the question asks for MongoDB Atlas or a cloud NoSQL
database.

## A. Get the connection string

1.  Sign in to MongoDB Atlas.
2.  Create or select a project.
3.  Create or select a database deployment.
4.  In **Database Access**, create a database user with a username and
    password. This may be different from your Atlas website login.
5.  In **Network Access**, allow the lab computer's current IP address.
    Use the narrowest access allowed by your lab. Do not open access to
    everyone unless explicitly required and permitted.
6.  Open your database deployment and select **Connect**.
7.  Choose the application/driver connection option and copy the
    connection string.
8.  Replace the username/password placeholders in the string with your
    database user's credentials. If the password has special characters,
    URL-encode them as Atlas instructs.

## B. Put it in `.env`

Replace the blank `MONGODB_URI` and change the flag:

``` env
USE_MONGODB=true
MONGODB_URI=mongodb+srv://YOUR-USER:YOUR-PASSWORD@YOUR-CLUSTER.mongodb.net/?retryWrites=true&w=majority
DB_NAME=cloud_lab
```

The URI above is only an example shape. Use the exact connection string
Atlas gives you; do not copy the example cluster name.

## C. Restart and verify

Stop the backend with `Ctrl + C`. Start it again:

``` bash
node server.js
```

Look for:

``` text
MongoDB Atlas connected successfully!
Storage: MongoDB Atlas
```

Open `http://localhost:3000/api/records`. Create a record through the
frontend or an API client, restart the server, and check again. The
record should remain because it is stored in Atlas.

## D. If it fails

Check the connection string, database username/password, IP access list,
and internet connection. If you cannot configure Atlas, set
`USE_MONGODB=false` and restart to return to in-memory storage.

------------------------------------------------------------------------

# Part 6 --- Firebase Cloud Firestore

The current code uses **Cloud Firestore with the Firebase Admin SDK**,
not Firebase Realtime Database.

## A. Get the service-account JSON

1.  Sign in to the Firebase Console.
2.  Create or select a Firebase project.
3.  Open **Build → Firestore Database** and create a database if one
    does not exist.
4.  Open **Project settings → Service accounts**.
5.  Generate a new private key if your account and lab rules permit it.
6.  Download the JSON file. It contains private credentials---do not
    share or commit it.
7.  Put it in the project root, beside `server.js` and `firebase.js`,
    with this exact filename:

``` text
serviceAccountKey.json
```

If you cannot create or download service credentials, ask your
instructor which approved project/credentials to use. Do not use
somebody else's private key without permission.

## B. Enable Firebase

In `.env`, change:

``` env
USE_FIREBASE=true
```

Save the file.

## C. Restart and test

Stop the backend with `Ctrl + C`, then run:

``` bash
node server.js
```

Open:

``` text
http://localhost:3000/api/firebase/records
```

It should return a JSON array, possibly empty at first.

To create a Firestore record, send a POST request to:

``` text
http://localhost:3000/api/firebase/records
```

Header:

``` text
Content-Type: application/json
```

Body:

``` json
{
  "name": "Rice",
  "category": "Food"
}
```

A successful response includes the new Firestore document ID.

## D. If it fails

Check that Firestore has been created, `USE_FIREBASE=true`, and the JSON
file is correctly named and located. Read the backend terminal error.

------------------------------------------------------------------------

# Part 7 --- Dropbox (Storage as a Service)

The current routes upload files to the root of the connected Dropbox
account and list files in that root.

## A. Create an app and get an access token

1.  Sign in to the Dropbox developer console.
2.  Create an app, or select one you are authorised to use.
3.  Choose the access type and permissions appropriate for the app.
4.  In the app's permissions, enable the file/content permissions needed
    to upload and list files. Save the permission changes.
5.  Generate an access token using the available developer-console flow.
6.  Treat the token like a password. It may expire or have limited
    permissions.

If the console does not offer a usable token or the token expires,
follow the current Dropbox developer-console instructions for the app's
authentication flow.

## B. Put the token in `.env`

``` env
USE_DROPBOX=true
DROPBOX_ACCESS_TOKEN=paste_the_real_access_token_here
```

Do not include quotation marks unless required, and do not commit the
token.

## C. Restart the backend

``` bash
node server.js
```

The code initialises the Dropbox client at startup. A successful
upload/list request is what confirms that the token and permissions
actually work.

## D. Upload a file

Use Postman or another API client:

1.  Select method **POST**.
2.  Enter `http://localhost:3000/api/dropbox/upload`.
3.  Select **Body → form-data**.
4.  Add a field with key exactly `file`.
5.  Change the field type from Text to **File**.
6.  Select a file and send the request.

The maximum upload size is 10 MB. A successful response contains the
file name and Dropbox path.

## E. List files

Open:

``` text
http://localhost:3000/api/dropbox/files
```

The response lists file names, paths, and sizes. If the route says
Dropbox is disabled, check `USE_DROPBOX=true` and restart the backend.

If the API returns 401/403, the token may be invalid/expired or lack the
necessary permissions.

------------------------------------------------------------------------

# Part 8 --- Auth0 (Authentication as a Service)

The current code supports login, logout, and reading the logged-in
user's profile. **The REST CRUD routes are not automatically protected
by login.**

## A. Create an Auth0 application

1.  Sign in to the Auth0 dashboard.
2.  Create or select an application suitable for a regular web
    application using `express-openid-connect`.
3.  Open the application's settings.
4.  Copy the **Domain**, **Client ID**, and **Client Secret**.

## B. Add the callback and logout URLs

For this local project, add these to the corresponding Auth0 application
settings:

-   **Allowed Callback URLs:** `http://localhost:3000/callback`
-   **Allowed Logout URLs:** `http://localhost:3000`
-   **Allowed Web Origins:** `http://localhost:3000`

Save the settings. If the Auth0 dashboard or the installed library gives
different setup instructions, follow the current instructions for that
application type.

## C. Put the values in `.env`

``` env
USE_AUTH0=true
AUTH0_SECRET=replace_with_a_long_random_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

Replace the example domain and IDs with the actual values from your
Auth0 dashboard. `AUTH0_ISSUER_BASE_URL` must contain the full HTTPS
issuer URL, usually `https://` followed by your Auth0 domain.
`AUTH0_SECRET` must be a long, random secret; do not use the placeholder
in a real configuration.

## D. Make one required code change in `server.js`

The current Auth0 middleware configuration must include the client
secret. Find this section near the top:

``` javascript
if (USE_AUTH0) {
  app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
  }));
}
```

Add the `clientSecret` line so it becomes:

``` javascript
if (USE_AUTH0) {
  app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
  }));
}
```

Keep the commas and braces as shown. Save `server.js`.

## E. Restart and test

Stop the backend and run:

``` bash
node server.js
```

Open:

``` text
http://localhost:3000/login
```

Complete the login flow. Then test:

``` text
http://localhost:3000/api/auth/profile
```

To log out, open:

``` text
http://localhost:3000/logout
```

If you see a callback/domain mismatch, compare the Auth0 URLs and `.env`
values character by character.

------------------------------------------------------------------------

# Part 9 --- How to adapt the project to a scenario

First identify what the scenario asks for. Do not change every file
unnecessarily.

## If the scenario is a CRUD application

Use the REST API. The existing fields are `name` and `category`. Change
the frontend labels and input fields to match the scenario.

If you rename fields in `frontend/index.html` or `frontend/app.js`, make
sure the request body and backend validation in `server.js` use the same
names. Otherwise, the frontend and backend will not agree.

## If the scenario asks for MongoDB Atlas

Configure Atlas, put the URI in `.env`, set `USE_MONGODB=true`, restart,
and test a record. Do not set the flag to true without a valid URI and
network access.

## If the scenario asks for Firebase

Place the service-account JSON beside `server.js`, set
`USE_FIREBASE=true`, restart, and test `/api/firebase/records`.

## If the scenario asks for Dropbox

Set `USE_DROPBOX=true`, add a valid token, restart, and test the upload
endpoint using multipart form-data.

## If the scenario asks for authentication

Configure Auth0 and its URLs, add `clientSecret` to the middleware as
shown above, set `USE_AUTH0=true`, restart, and test `/login`.

## If the scenario asks for a different application

For example, a food delivery scenario might use restaurant/order fields
rather than `name` and `category`. Change the frontend fields, request
body, and backend validation consistently. Do not change field names in
only one place.

------------------------------------------------------------------------

# Part 10 --- Common errors

  -----------------------------------------------------------------------
  Problem                             What to check
  ----------------------------------- -----------------------------------
  `node` or `npm` not recognised      Node.js is installed and available
                                      in the terminal

  `Cannot find module ...`            Run `npm install` from the project
                                      root

  Port 3000 is already in use         Stop the other server with
                                      `Ctrl + C`, or select a free port
                                      and update the frontend URL

  Browser cannot connect              Ensure `node server.js` is still
                                      running and use the correct URL

  `.env` values are not picked up     Ensure the file is named `.env`, is
                                      in the project root, and restart
                                      the server after edits

  MongoDB fails                       Check Atlas URI, database user
                                      credentials, network access, and
                                      internet

  Firebase credentials not found      Check the exact filename
                                      `serviceAccountKey.json` and its
                                      location

  Dropbox 401/403                     Check token validity and required
                                      permissions

  Auth0 callback error                Check the issuer URL, client
                                      ID/secret, callback URL, and logout
                                      URL

  Cloud route says disabled           Change the relevant `USE_...` flag
                                      to `true` and restart

  Frontend does not load              Start its server in a second
                                      terminal and open
                                      `http://localhost:8080`
  -----------------------------------------------------------------------

The backend's generic error handler sends a short error to the client.
The more useful error is usually printed in the backend terminal. Read
that terminal first.

------------------------------------------------------------------------

# Final checklist for the lab computer

-   [ ] Clone the correct repository.
-   [ ] Enter the folder containing `package.json`.
-   [ ] Check `node -v` and `npm -v`.
-   [ ] Run `npm install`.
-   [ ] Create local `.env` from `.env.example` or the template above.
-   [ ] Configure only the cloud service(s) required by the scenario.
-   [ ] Keep credentials out of Git.
-   [ ] Run `node server.js`.
-   [ ] Test `http://localhost:3000/`.
-   [ ] Test `http://localhost:3000/api/records`.
-   [ ] Start the frontend in a second terminal if needed.
-   [ ] Keep the backend terminal open while testing.

## Commands to remember

``` bash
npm install
node server.js
```

In a second terminal:

``` bash
npx http-server frontend -p 8080
```

To stop a running server, click its terminal and press `Ctrl + C`.

**Honest status:** The local REST CRUD API has been tested. MongoDB
Atlas, Firebase, Dropbox, and Auth0 require their own credentials,
configuration, and successful live tests before you can say those
integrations are working.

Akshaya run from friend-frontend Tanisha from frontend
