# Gmail API OAuth Setup

The extension uses Google's Gmail API with the metadata-only scope. Google requires an OAuth client bound to the installed extension ID; that client ID cannot be generated automatically by the extension.

## Configure Google Cloud

1. Load this folder as an unpacked extension and copy its ID from `chrome://extensions` or `edge://extensions`.
2. In Google Cloud Console, create or select a project.
3. Enable **Gmail API** for that project.
4. Configure the OAuth consent screen. During development, add your Gmail address as a test user.
5. Create an OAuth client ID for a **Chrome Extension** and enter the extension ID copied in step 1.
6. Copy the issued client ID.
7. In `manifest.json`, replace `REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` with the complete client ID issued by Google.
8. Reload the extension.
9. Open the popup, choose Inbox, Sent, or both, and press **Connect Gmail**.

## Data Boundary

The extension requests `gmail.metadata`. It lists one message ID per selected mailbox and retrieves that message's `internalDate` using `format=minimal`. It does not request or process message bodies, subjects, recipients, senders, or attachments.

The Gmail API currently provides a large no-charge daily quota threshold. This extension's metadata polling stays far below it, so paid Cloud billing is not required for ordinary personal use. Do not enroll in a paid Cloud trial merely to run this extension.

Google may require OAuth verification before an external app can be distributed broadly with a restricted Gmail scope. A development project with explicitly registered test users can be used for local testing.
